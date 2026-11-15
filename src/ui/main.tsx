// Entry point: mount the app. Everything else lives in app.tsx and the screens.

import './styles.css';
import { render } from 'preact';
import { App } from './app.tsx';

render(<App />, document.getElementById('app') as HTMLElement);
