// import React, { createContext, useContext, useReducer, useEffect } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const initialState = {
//   studyTime: 25,
//   breakTime: 5,
//   ambientIndex: null,
//   customSoundUri: null,
//   backgroundImage: null,
//   selectedColor: "#1E1E1E",
//   selectedGradient: null,
//   backgroundType: "solid",
// };

// const AppContext = createContext();

// function reducer(state, action) {
//   switch (action.type) {
//     case "SET":
//       return { ...state, ...action.payload };
//     default:
//       return state;
//   }
// }

// export const AppProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   useEffect(() => {
//     (async () => {
//       const saved = await AsyncStorage.getItem("appState");
//       if (saved) dispatch({ type: "SET", payload: JSON.parse(saved) });
//     })();
//   }, []);

//   useEffect(() => {
//     AsyncStorage.setItem("appState", JSON.stringify(state));
//   }, [state]);

//   const setValue = (payload) => dispatch({ type: "SET", payload });

//   return (
//     <AppContext.Provider
//       value={{
//         ...state,
//         setStudyTime: (v) => setValue({ studyTime: v }),
//         setBreakTime: (v) => setValue({ breakTime: v }),
//         setAmbientIndex: (v) => setValue({ ambientIndex: v }),
//         setCustomSoundUri: (v) => setValue({ customSoundUri: v }),
//         setBackgroundImage: (v) => setValue({ backgroundImage: v }),
//         setSelectedColor: (v) => setValue({ selectedColor: v }),
//         setSelectedGradient: (v) => setValue({ selectedGradient: v }),
//         setBackgroundType: (v) => setValue({ backgroundType: v }),
//       }}
//     >
//       {children}
//     </AppContext.Provider>
//   );
// };

// export const useAppState = () => {
//   const context = useContext(AppContext);
//   if (!context) throw new Error("Must be inside provider");
//   return context;
// };
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
  studyTime: 25,
  breakTime: 5,
  ambientIndex: null,
  customSoundUri: null,
  backgroundImage: null,
  selectedColor: "#1E1E1E",
  selectedGradient: null,
  backgroundType: 'solid', // 'solid', 'gradient', or 'image'
};

// Action types
const SET_STUDY_TIME = 'SET_STUDY_TIME';
const SET_BREAK_TIME = 'SET_BREAK_TIME';
const SET_AMBIENT_INDEX = 'SET_AMBIENT_INDEX';
const SET_CUSTOM_SOUND_URI = 'SET_CUSTOM_SOUND_URI';
const SET_BACKGROUND_IMAGE = 'SET_BACKGROUND_IMAGE';
const SET_SELECTED_COLOR = 'SET_SELECTED_COLOR';
const SET_SELECTED_GRADIENT = 'SET_SELECTED_GRADIENT';
const SET_BACKGROUND_TYPE = 'SET_BACKGROUND_TYPE';
const LOAD_STATE = 'LOAD_STATE';

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case SET_STUDY_TIME:
      return { ...state, studyTime: action.payload };
    case SET_BREAK_TIME:
      return { ...state, breakTime: action.payload };
    case SET_AMBIENT_INDEX:
      return { ...state, ambientIndex: action.payload };
    case SET_CUSTOM_SOUND_URI:
      return { ...state, customSoundUri: action.payload };
    case SET_BACKGROUND_IMAGE:
      return { ...state, backgroundImage: action.payload };
    case SET_SELECTED_COLOR:
      return { ...state, selectedColor: action.payload };
    case SET_SELECTED_GRADIENT:
      return { ...state, selectedGradient: action.payload };
    case SET_BACKGROUND_TYPE:
      return { ...state, backgroundType: action.payload };
    case LOAD_STATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved state on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedState = await AsyncStorage.getItem('appState');
        if (savedState) {
          const parsed = JSON.parse(savedState);

          // Ensure all keys exist to prevent undefined
          dispatch({
            type: LOAD_STATE,
            payload: {
              studyTime: parsed.studyTime ?? 25,
              breakTime: parsed.breakTime ?? 5,
              ambientIndex: parsed.ambientIndex ?? null,
              customSoundUri: parsed.customSoundUri ?? null,
              backgroundImage: parsed.backgroundImage ?? null,
              selectedColor: parsed.selectedColor ?? "#1E1E1E",
              selectedGradient: parsed.selectedGradient ?? null,
              backgroundType: parsed.backgroundType ?? 'solid',
            }
          });
        }
      } catch (error) {
        console.log('Error loading state:', error);
      }
    };
    loadData();
  }, []);

  // Save to AsyncStorage whenever state changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('appState', JSON.stringify(state));
      } catch (error) {
        console.log('Error saving state:', error);
      }
    };
    saveData();
  }, [state]);

  // Action dispatchers
  const setStudyTime = (time) => dispatch({ type: SET_STUDY_TIME, payload: time });
  const setBreakTime = (time) => dispatch({ type: SET_BREAK_TIME, payload: time });
  const setAmbientIndex = (index) => dispatch({ type: SET_AMBIENT_INDEX, payload: index });
  const setCustomSoundUri = (uri) => dispatch({ type: SET_CUSTOM_SOUND_URI, payload: uri });
  const setBackgroundImage = (image) => dispatch({ type: SET_BACKGROUND_IMAGE, payload: image });
  const setSelectedColor = (color) => dispatch({ type: SET_SELECTED_COLOR, payload: color });
  const setSelectedGradient = (gradient) => dispatch({ type: SET_SELECTED_GRADIENT, payload: gradient });
  const setBackgroundType = (type) => dispatch({ type: SET_BACKGROUND_TYPE, payload: type });

  return (
    <AppContext.Provider
      value={{
        ...state,
        setStudyTime,
        setBreakTime,
        setAmbientIndex,
        setCustomSoundUri,
        setBackgroundImage,
        setSelectedColor,
        setSelectedGradient,
        setBackgroundType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within an AppProvider');
  return context;
};