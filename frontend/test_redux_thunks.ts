import { store } from './src/store';
import { fetchBlockchainHealthThunk } from './src/modules/blockchain/store/blockchain.slice';

async function runTest() {
  console.log('Testing frontend Redux integration...');
  const result = await store.dispatch(fetchBlockchainHealthThunk());
  console.log('fetchBlockchainHealthThunk Result:', result);
  
  if (result.meta.requestStatus === 'fulfilled') {
    console.log('Frontend successfully communicated with Backend API via Redux Toolkit!');
  } else {
    console.error('Failed to communicate. Check API Base URL or Server.');
  }
}

runTest();
