import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { AppProvider, useAppState } from "./AppContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const sound1 = require("./assets/sounds/sound1.mp3");
const sound2 = require("./assets/sounds/sound2.mp3");
const sound3 = require("./assets/sounds/sound3.mp3");
const ringSound = require("./assets/sounds/ring.mp3");
const countdownSound = require("./assets/sounds/countdown.mp3");

const builtInSounds = [sound1, sound2, sound3];

const presets = [
  { study: 25, break: 5 },
  { study: 50, break: 10 },
  { study: 45, break: 15 },
];

const solidColors = ["#1E1E1E", "#2E4057", "#3A5A40", "#344E41", "#22223B"];
const gradients = [
  ["#1E3C72", "#2A5298"],
  ["#42275a", "#734b6d"],
  ["#0f2027", "#203a43"],
  ["#2C5364", "#203A43"],
  ["#373B44", "#4286f4"],
];

const PomodoroApp = () => {
  const {
    studyTime,
    breakTime,
    ambientIndex,
    customSoundUri,
    backgroundImage,
    selectedColor,
    selectedGradient,
    backgroundType,
    setStudyTime,
    setBreakTime,
    setAmbientIndex,
    setCustomSoundUri,
    setBackgroundImage,
    setSelectedColor,
    setSelectedGradient,
    setBackgroundType,
  } = useAppState();

  const [isStudy, setIsStudy] = useState(true);
  const [timeLeft, setTimeLeft] = useState(studyTime * 60);
  const [running, setRunning] = useState(false);
  const [customStudy, setCustomStudy] = useState("");
  const [customBreak, setCustomBreak] = useState("");

  // State for collapsible sections
  const [showColors, setShowColors] = useState(false);
  const [showGradients, setShowGradients] = useState(false);

  const timerRef = useRef(null);
  const ambientRef = useRef(null);
  const ringRef = useRef(null);
  const countdownRef = useRef(null);

  // Calculate progress for circular indicator
  const totalTime = isStudy ? studyTime * 60 : breakTime * 60;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const radius = Math.min(SCREEN_WIDTH * 0.25, SCREEN_HEIGHT * 0.25); // Responsive radius
  const strokeWidth = radius * 0.08; // Responsive stroke width
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  // Initialize audio players
  useEffect(() => {
    const initializeAudio = async () => {
      // Initialize ring sound
      const ring = new Audio.Sound();
      await ring.loadAsync(ringSound);
      ringRef.current = ring;

      // Initialize countdown sound
      const countdown = new Audio.Sound();
      await countdown.loadAsync(countdownSound);
      countdownRef.current = countdown;
    };

    initializeAudio();

    return () => {
      // Clean up all audio players
      if (ringRef.current) {
        ringRef.current.unloadAsync();
      }
      if (countdownRef.current) {
        countdownRef.current.unloadAsync();
      }
      if (ambientRef.current) {
        ambientRef.current.unloadAsync();
      }
    };
  }, []);

  // Ambient sound management
  useEffect(() => {
    if (running) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }
  }, [running, ambientIndex, customSoundUri]);

  const startAmbientSound = async () => {
    // Stop any existing ambient sound
    if (ambientRef.current) {
      await ambientRef.current.stopAsync();
      await ambientRef.current.unloadAsync();
    }

    let source;
    if (customSoundUri) {
      source = { uri: customSoundUri };
    } else if (ambientIndex !== null) {
      source = builtInSounds[ambientIndex];
    } else {
      return; // No sound to play
    }

    const ambient = new Audio.Sound();
    await ambient.loadAsync(source, { shouldPlay: true, isLooping: true, volume: 0.5 });
    ambientRef.current = ambient;
  };

  const stopAmbientSound = async () => {
    if (ambientRef.current) {
      await ambientRef.current.stopAsync();
      await ambientRef.current.unloadAsync();
      ambientRef.current = null;
    }
  };

  // Timer Logic
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            switchSession();
            return 0;
          }

          if (prev <= 5) {
            playCountdownSound();
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    setTimeLeft(studyTime * 60);
  }, [studyTime]);

  const switchSession = async () => {
    await playRingSound();
    const next = !isStudy;
    setIsStudy(next);
    setTimeLeft(next ? studyTime * 60 : breakTime * 60);
  };

  const playRingSound = async () => {
    if (ringRef.current) {
      await ringRef.current.setPositionAsync(0);
      await ringRef.current.playAsync();
    }
  };

  const playCountdownSound = async () => {
    if (countdownRef.current) {
      await countdownRef.current.setPositionAsync(0);
      await countdownRef.current.playAsync();
    }
  };

  const toggleTimer = async () => {
    if (!running) {
      await playRingSound();
    }
    setRunning(!running);
  };

  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const applyPreset = (preset) => {
    setStudyTime(preset.study);
    setBreakTime(preset.break);
    setTimeLeft(preset.study * 60);
    setRunning(false);
  };

  const applyCustom = () => {
    const s = parseInt(customStudy);
    const b = parseInt(customBreak);
    if (!isNaN(s) && !isNaN(b) && s > 0 && b > 0) {
      setStudyTime(s);
      setBreakTime(b);
      setTimeLeft(s * 60);
      setRunning(false);
    } else {
      Alert.alert("Invalid Input", "Enter valid positive numbers");
    }
  };

  const selectSolidColor = (color) => {
    setSelectedColor(color);
    setSelectedGradient(null);
    setBackgroundImage(null);
    setBackgroundType('solid');
    setShowColors(false); // Close after selection
  };

  const selectGradient = (gradient) => {
    setSelectedGradient(gradient);
    setSelectedColor("#1E1E1E");
    setBackgroundImage(null);
    setBackgroundType('gradient');
    setShowGradients(false); // Close after selection
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setBackgroundImage(result.assets[0].uri);
        setSelectedGradient(null);
        setSelectedColor("#1E1E1E");
        setBackgroundType('image');
      }
    } catch (e) {
      console.log('Image pick error:', e);
    }
  };

 const pickSound = async () => {
    try {
      console.log("Starting DocumentPicker..."); // Debug log
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*", // Allow audio files
        copyToCacheDirectory: true, // Optional: Copies to cache for more reliable access
      });

      console.log("DocumentPicker result:", result); // Debug log

      // --- Updated Logic ---
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Picker succeeded, asset:", result.assets[0]); // Debug log
        
        const pickedAsset = result.assets[0]; // Get the first picked file
        const uri = pickedAsset.uri;
        const fileName = pickedAsset.name; // Optional: for display/debugging

        // Extract file extension to validate
        const fileExtension = uri.split('.').pop()?.toLowerCase();

        if (fileExtension === 'mp3' || fileExtension === 'wav' || fileExtension === 'm4a' || fileExtension === 'aac') {
          setCustomSoundUri(uri); // Store the URI from the picked asset
          setAmbientIndex(null); // Turn off built-in sounds
          Alert.alert("Success", "Custom sound loaded successfully!");

          // If timer is running, the ambient player will automatically use the new source
          // due to the useEffect watching ambientSource
        } else if (result.canceled) {
          console.log("Picker was cancelled by the user"); // Debug log
          Alert.alert("Cancelled", "Sound selection was cancelled.");}
      } else {
          // This case might happen if assets array is empty but not canceled
          console.log("Picker returned with no assets or unexpected structure:", result); // Debug log
          Alert.alert("Error", "No file was selected or the selection was invalid.");
      }
      // -------------------

    } catch (error) {
      console.error("Error picking sound:", error);
      Alert.alert("Error", "Could not pick sound file. Please try again. Details: " + error.message);
    }
  };

  const renderBackground = () => {
    if (backgroundType === 'image' && backgroundImage) {
      return (
        <ImageBackground source={{ uri: backgroundImage }} style={styles.container} resizeMode="cover">
          <ScrollView contentContainerStyle={[styles.scrollContent, { padding: 20 }]}>
            {renderContent()}
          </ScrollView>
        </ImageBackground>
      );
    }
    if (backgroundType === 'gradient' && selectedGradient) {
      return (
        <LinearGradient colors={selectedGradient} style={styles.container}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { padding: 20 }]}>
            {renderContent()}
          </ScrollView>
        </LinearGradient>
      );
    }
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: selectedColor, padding: 20 }]}>
        {renderContent()}
      </ScrollView>
    );
  };

  const renderContent = () => (
    <>
      <Text style={styles.mode}>{isStudy ? "STUDY" : "BREAK"}</Text>
      
      {/* Circular Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressWrapper}>
          {/* Background circle */}
          <View style={[styles.circleBackground, { width: radius*2, height: radius*2 }]}>
            <View style={[
              styles.circleTrack, 
              { 
                width: radius*2 - strokeWidth, 
                height: radius*2 - strokeWidth,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: isStudy ? "#2E7D32" : "#F57C00"
              }]} />
          </View>
    
          
          <View style={styles.timeDisplay}>
            <Text style={styles.timer}>{formatTime()}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={toggleTimer}>
        <Text style={styles.buttonText}>{running ? "PAUSE" : "START"}</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsContainer}>
        {presets.map((p, i) => (
          <TouchableOpacity key={i} style={styles.preset} onPress={() => applyPreset(p)}>
            <Text style={styles.smallText}>{p.study}:{p.break}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.customRow}>
        <TextInput
          placeholder="Study (min)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={customStudy}
          onChangeText={setCustomStudy}
          style={styles.input}
        />
        <TextInput
          placeholder="Break (min)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={customBreak}
          onChangeText={setCustomBreak}
          style={styles.input}
        />
        <TouchableOpacity onPress={applyCustom} style={styles.applyBtn}>
          <Text style={styles.smallText}>SET</Text>
        </TouchableOpacity>
      </View>

      {/* Sound Controls Row */}
      <View style={styles.soundControlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.soundsContainer}>
          <TouchableOpacity
            style={styles.preset}
            onPress={() => {
              setAmbientIndex(null);
              setCustomSoundUri(null);
              stopAmbientSound();
            }}
          >
            <Text style={styles.smallText}>No Music</Text>
          </TouchableOpacity>

          {builtInSounds.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={styles.preset}
              onPress={() => {
                setAmbientIndex(i);
                setCustomSoundUri(null);
              }}
            >
              <Text style={styles.smallText}>{i=== 0 ? "Forest" : i === 1 ? "Fire" : "Ambient"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>
        <TouchableOpacity style={styles.smallBtn} onPress={pickSound}>
          <Text style={styles.smallText}>Custom Sound</Text>
        </TouchableOpacity>

      {/* Collapsible Colors Section */}
      <TouchableOpacity
        style={styles.sectionTitleContainer}
        onPress={() => {
          setShowColors(!showColors);
          if (showColors) setShowGradients(false); // Close gradients if opening colors
        }}
      >
        <Text style={styles.sectionTitle}>Solid Colors</Text>
        <Text style={styles.toggleArrow}>{showColors ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {showColors && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsContainer}>
          {solidColors.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.colorPill, { backgroundColor: c }]}
              onPress={() => selectSolidColor(c)}
            />
          ))}
        </ScrollView>
      )}

      {/* Collapsible Gradients Section */}
      <TouchableOpacity
        style={styles.sectionTitleContainer}
        onPress={() => {
          setShowGradients(!showGradients);
          if (showGradients) setShowColors(false); // Close colors if opening gradients
        }}
      >
        <Text style={styles.sectionTitle}>Gradients</Text>
        <Text style={styles.toggleArrow}>{showGradients ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {showGradients && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradientsContainer}>
          {gradients.map((g, i) => (
            <TouchableOpacity key={i} style={styles.gradientPill} onPress={() => selectGradient(g)}>
              <LinearGradient colors={g} style={styles.gradientInner} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.smallBtn} onPress={pickImage}>
        <Text style={styles.smallText}>Background Image</Text>
      </TouchableOpacity>
      
      {/* Add some bottom padding for better scrolling */}
      <View style={{ height: 40 }} />
    </>
  );

  return renderBackground();
};

export default function App() {
  return (
    <AppProvider>
      <PomodoroApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mode: {
    fontSize: 22,
    color: "white",
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    fontWeight:700
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  progressWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTrack: {
    borderRadius: 90,
    borderColor: 'transparent',
  },
  progressCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transformOrigin: 'left center',
  },
  timeDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  button: {
    backgroundColor: "#ffffff70",
    padding: 8,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  presetsContainer: {
    marginVertical: 10,
    maxHeight: 60,
  },
  soundControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  soundsContainer: {
    flex: 1, // Take up available space
    maxHeight: 60,
  },
  colorsContainer: {
    maxHeight: 60,
  },
  gradientsContainer: {
    maxHeight: 60,
  },
  preset: {
    backgroundColor: "#ffffff70",
    padding: 10,
    margin: 5,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  colorPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    borderWidth: 2,
    borderColor: "white",
  },
  gradientPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
  },
  gradientInner: {
    width: "100%",
    height: "100%",
  },
  smallBtn: {
    padding: 10,
    backgroundColor: "#ffffff70",
    borderRadius: 8,
    alignItems: "center",
    marginTop:20,
    minWidth: 120, // Ensure consistent width
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 15,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  toggleArrow: {
    color: "white",
    fontSize: 16,
  },
  smallText: {
    color: "white",
    fontSize: 14,
  },
  input: {
    backgroundColor: "white",
    width: 80,
    margin: 5,
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },
  customRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtn: {
    backgroundColor: "#ffffff40",
    padding: 10,
    margin: 5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});