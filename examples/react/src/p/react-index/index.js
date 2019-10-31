import './index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import Root from '../../c/react-index/components/Root';
import configureStore from '../../c/react-index/redux/configureStore';

const initialState = {
    contacts: [
        {
            name: 'Wilber',
            number: '13111111191'
        },
        {
            name: 'Will',
            number: '13111191112'
        }
    ],
    content: {
        counter: 0,
        items: []
    }
};

const store = configureStore(initialState);

ReactDOM.render(<Root store={store} />, document.getElementById('root'));
