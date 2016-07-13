import crypto from 'crypto';
import winston from 'winston';
// import buildAvatarURLForSize from '../../lib/buildAvatarURLForSize';
import EnhancedError from '../../lib/EnhancedError';
import { APP_PRIORITIES /* , TYPE_USER*/ } from '../../lib/Constants';
import { bus, config } from '../../core-server';
// import { urlTos3 } from '../../lib/upload';

function getDate(long) {
	const date = new Date();

	if (long) {
		return date.toISOString().replace(/[\-:]/g, '').replace(/\.\d+/g, '');
	} else {
		return date.getUTCFullYear().toString() +
		('0' + date.getUTCMonth().toString()).substr(-2) +
		('0' + date.getUTCDate().toString()).substr(-2);
	}
}

function getExpiration() {
	const validity = config.s3.validity;
	return (new Date(Date.now() + validity)).toISOString();
}

function sign(key, data) {
	return crypto.createHmac('sha256', key).update(data).digest();
}

function getKeyPrefix(userId, uploadType, textId) {
	switch (uploadType) {
	case 'avatar':
	case 'banner':
		return 'uploaded/' + uploadType + '/' + userId + '/';
	case 'content':
		return 'uploaded/' + uploadType + '/' + userId + '/' + textId + '/';
	}

	return '';
}

function getCredential() {
	return `${config.s3.accessKey}/${getDate()}\
		/${config.s3.region}/${config.s3.service}\
		/${config.s3.signatureVersion}`;
}

function getPolicy(keyPrefix) {
	return new Buffer(JSON.stringify({
		expiration: getExpiration(),
		conditions: [
			{ bucket: config.s3.bucket },
			{ acl: config.s3.acl },
			[ 'starts-with', '$key', keyPrefix ],
			{ success_action_status: '201' },
			{ 'x-amz-credential': getCredential() },
			{ 'x-amz-algorithm': config.s3.algorithm },
			{ 'x-amz-date': getDate(true) },
		],
	})).toString('base64');
}

function getSignature(policy) {
	const kDate = sign('AWS4' + config.s3.secretKey, getDate());
	const kRegion = sign(kDate, config.s3.region);
	const kService = sign(kRegion, config.s3.service);
	const signingKey = sign(kService, config.s3.signatureVersion);
	const signature = sign(signingKey, policy).toString('hex');
	return signature;
}

export function getResponse(policyReq) {
	const keyPrefix = getKeyPrefix(policyReq.auth.user, policyReq.uploadType, policyReq.textId),
		policy = getPolicy(keyPrefix),
		signature = getSignature(policy),
		baseURL = 'https://up.bel.ng/',
		fileName = policyReq.fileName.replace(/\s+/g, ' ');
	let key = keyPrefix,
		thumbnail = baseURL + keyPrefix.replace(/^uploaded/, 'generated'),
		url;

	switch (policyReq.uploadType) {
	case 'avatar':
		key += 'original.' + fileName.split('.').pop();
		url = baseURL + key;
		thumbnail += '256x256.jpg';
		break;
	case 'content':
		key += '1/' + fileName;
		url = baseURL + keyPrefix + '1/' + encodeURIComponent(fileName);
		thumbnail += '1/480x960.jpg';
		break;
	}

	policyReq.response = {
		key,
		url,
		thumbnail,
		policy: {
			acl: config.s3.acl,
			policy,
			'x-amz-algorithm': config.s3.algorithm,
			'x-amz-credential': getCredential(),
			'x-amz-date': getDate(true),
			'x-amz-signature': signature,
		},
	};
}

if (!config.s3) {
	winston.info('Image upload is disabled');
	bus.on('s3/getPolicy', (policyReq) => {
		policyReq.response = {};
		policyReq.response.error = new EnhancedError('Image upload is temporarily disabled', 'NO_CONFIG_FOUND_FO_S3');
	}, APP_PRIORITIES.IMAGE_UPLOAD);
} else {
	bus.on('s3/getPolicy', (policyReq) => {
		try {
			getResponse(policyReq);
		} catch (error) {
			policyReq.response = { error };
		}
	}, APP_PRIORITIES.IMAGE_UPLOAD);
	winston.info('Image upload is ready');
}

/*
const uploadImage = async (userName: string, imageUrl: string, propName: string) => {
	const imageName = 'avatar';
	await urlTos3(buildAvatarURLForSize(imageUrl, 1024), 'a/' + userName + '/' + imageName);
	const changes = {
		entities: {
			[userName]: {
				type: TYPE_USER,
				id: userName,
				[propName]: {
					picture: [ '$delete' ]
				}
			}
		}
	};
	bus.emit('change', changes);
};

if (config.s3) {
		bus.on('postchange', async ({ entities }) => {
		const promises = [];
		if (entities) {
			for (const id in entities) {
				const entity = entities[id];
				if (entity.type !== TYPE_USER) {
					continue;
				} else {
					if (entity.params && entity.params.picture) {
						promises.push(
							uploadImage(entity.id, entity.params.picture, 'params')
						);
					} else if (entity.meta && entity.meta.picture) {
						promises.push(
							uploadImage(entity.id, entity.meta.picture, 'meta')
						);
					}
				}
			}
		}
		await Promise.all(promises);
	});
}

*/
