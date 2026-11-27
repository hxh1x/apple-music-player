import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";
import downloadReducer from "./downloadSlice";
import libraryReducer from "./librarySlice";
import playerReducer from "./playerSlice";

export const store = configureStore({
  reducer: {
    player: playerReducer,
    library: libraryReducer,
    download: downloadReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
