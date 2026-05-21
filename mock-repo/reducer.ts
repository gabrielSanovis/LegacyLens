import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  data: any;
  loading: boolean;
  error: any;
}

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUser(state, action: PayloadAction<{ userId: string }>) {
      state.loading = true;
    },
    fetchUserSuccess(state, action: PayloadAction<any>) {
      state.loading = false;
      state.data = action.payload;
    },
    fetchUserFailure(state, action: PayloadAction<any>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchUser, fetchUserSuccess, fetchUserFailure } = userSlice.actions;
export default userSlice.reducer;
