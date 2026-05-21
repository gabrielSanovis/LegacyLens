import { call, put, takeEvery } from 'redux-saga/effects';

interface FetchUserAction {
  type: 'FETCH_USER';
  payload: { userId: string };
}

export function* fetchUserSaga(action: FetchUserAction) {
  try {
    const user = yield call(() => Promise.resolve({ id: action.payload.userId, name: 'Alice' }));
    yield put({ type: 'FETCH_USER_SUCCESS', payload: user });
  } catch (error) {
    yield put({ type: 'FETCH_USER_FAILURE', payload: error });
  }
}

export function* watchFetchUser() {
  yield takeEvery('FETCH_USER', fetchUserSaga);
}
