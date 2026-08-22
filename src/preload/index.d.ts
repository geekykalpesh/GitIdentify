import { GitIdentityApi } from './index';

declare global {
  interface Window {
    gitIdentityApi: GitIdentityApi;
  }
}
