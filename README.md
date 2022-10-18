# An axios enhancer

Add custom config to make it cancelable and retryable.

usage:

```
import axios from 'axios'

const enhancedAxios = axiosEnhancer(axios) // or axios.create()

enhancedAxios('/url', { $$userConfig: { cancelable: true, retryCount: 1 } }) // when axios throws 'ETIMEDOUT' error or 'ECONNABORTED' error, it will retry

enhancedAxios.$$ctlManager.abortAndRemove('/url') // the request will be cancelled

```
