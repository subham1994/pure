/* @flow */

import React, { Component, PropTypes } from 'react';
import shallowEqual from 'shallowequal';
import RoomListContainer from '../../containers/RoomListContainer';
import RoomListForModerationContainer from '../../containers/RoomListForModerationContainer';

type Props = {
	rooms: ?Array<Object>;
}

export default class Rooms extends Component<void, Props, void> {
	static propTypes = {
		rooms: PropTypes.array,
	};

	shouldComponentUpdate(nextProps: Props): boolean {
		return !shallowEqual(this.props, nextProps);
	}

	render() {
		// if (rooms && rooms.length) {
			return <RoomListForModerationContainer {...this.props} />;
		// } else {
		// 	return <RoomListContainer {...this.props} />;
		// }
	}
}
