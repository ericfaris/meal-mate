import { AppRegistry } from 'react-native';
import App from '../App';
import { redirectToWelcomeIfFirstVisit } from './utils/welcome';

if (!redirectToWelcomeIfFirstVisit()) {
  AppRegistry.registerComponent('main', () => App);
  AppRegistry.runApplication('main', { rootTag: document.getElementById('root') });
}
