/*
 * Helper component to provide the store to child components
 *
 * Usage: <Provider store={store}><RootComponent /></Provider>
 *
 * @flow
 */

import React, { Component, Children, PropTypes } from 'react';
import SimpleStore from './SimpleStore';
import storeShape from './storeShape';

type Props = {
	children?: React.Element;
	store: SimpleStore;
}

export default class Provider extends Component<void, Props, void> {
	static propTypes = {
		children: PropTypes.element.isRequired,
		store: storeShape.isRequired,
	};

	static childContextTypes = {
		store: storeShape.isRequired,
	};

	getChildContext(): Object {
		return {
			store: this.props.store,
		};
	}

	render(): any {
		return Children.only(this.props.children);
	}
}
