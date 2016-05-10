/* @flow */

import React, { Component } from 'react';
import shallowEqual from 'shallowequal';
import Connect from '../../../modules/store/Connect';
import RoomListForModeration from '../views/Homescreen/RoomListForModeration';

type Props = {
	prefix: string;
}

type State = {
	prefix: string;
}

export default class RoomListForModerationContainer extends Component<void, Props, State> {
	state: State = {
		prefix: '',
	};

	shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
		return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
	}

	_setQuery: Function = (query: string) => {
		this.setState({
			prefix: query.trim(),
		});
	};

	render() {
		const {
			prefix,
		} = this.state;

		let mapSubscriptionToProps;

		if (prefix) {
			mapSubscriptionToProps = {
				data: {
					key: {
						slice: {
							type: 'room',
							filter: {
								name_pref: prefix,
							},
							order: 'updateTime',
						},
						range: {
							start: -Infinity,
							before: 0,
							after: 10,
						},
					},
				},
			};
		}

		return (
			<Connect
				mapSubscriptionToProps={mapSubscriptionToProps}
				passProps={{ ...this.props, setQuery: this._setQuery }}
				component={RoomListForModeration}
			/>
		);
	}
}
