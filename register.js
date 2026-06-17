import { register } from 'ts-node/esm';

register({
  esm: true,
  tsconfig: './server/tsconfig.json'
});
