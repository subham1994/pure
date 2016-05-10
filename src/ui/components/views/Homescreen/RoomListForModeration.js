/* @flow */

import React, { Component, PropTypes } from 'react';
import shallowEqual from 'shallowequal';
import RoomListContainer from '../../containers/RoomListContainer';
import SearchableList from '../SearchableList';
import RoomItem from './RoomItem';
import NavigationActions from '../../../navigation-rfc/Navigation/NavigationActions';

type Props = {
	data?: Array<{ id: string; name: string; type: number; } | { type: 'loading' }>;
	setQuery: (query: string) => void;
	onNavigation: Function;
}

export default class RoomListForModeration extends Component<void, Props, void> {
	static propTypes = {
		data: PropTypes.arrayOf(PropTypes.object),
		setQuery: PropTypes.func.isRequired,
		onNavigation: PropTypes.func.isRequired,
	};

	componentWillReceiveProps(nextProps: Props) {
		console.log(nextProps);
		if (this._pendingQuery) {
			const { data } = nextProps;

			if (data && data.length === 1 && data[0] && data[0].type === 'loading') {
				return;
			}

			this._pendingQuery(data);
		}
	}

	shouldComponentUpdate(nextProps: Props): boolean {
		return !shallowEqual(this.props, nextProps);
	}

	_pendingQuery: ?Function;

	_handleSelectLocality: Function = room => {
		this.props.onNavigation(new NavigationActions.Push({
			name: 'room',
			props: {
				room: room.id,
			},
		}));
	};

	_renderRow: Function = room => {
		return (
			<RoomItem
				key={room.id}
				room={room}
				onSelect={this._handleSelectLocality}
			/>
		);
	};

	_getResults: Function = (filter: string) => {
		return new Promise((resolve, reject) => {
			this._pendingQuery = data => {
				this._pendingQuery = null;
				resolve(data.filter(({ name }) => {
					return name.toLowerCase().indexOf(filter.toLowerCase()) === 0;
				}));
			};
			this.props.setQuery(filter);

			setTimeout(() => {
				this._pendingQuery = null;
				reject(new Error('Query timed out'));
			}, 3000);
		});
	};

	_renderBlankslate: Function = () => {
		const { data, ...rest } = this.props; // eslint-disable-line no-unused-vars

		return <RoomListContainer {...rest} />;
	};

	render() {
		return (
			<SearchableList
				autoFocus={false}
				getResults={this._getResults}
				renderRow={this._renderRow}
				renderBlankslate={this._renderBlankslate}
				searchHint='Search for groups'
			/>
		);
	}
}
