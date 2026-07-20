import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  AccessibilityInfo,
  Image,
  useWindowDimensions,
} from 'react-native';
import Head from 'expo-router/head';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useGameStore, Choice } from '@/store/useGameStore';

const WORD_LOGO = require('@/assets/images/Covenant-Odyssey-Words.png');
const FULL_LOGO = require('@/assets/images/Covenant-Odyssey-Divergent-Prophecies-Logo.png');
const DEFAULT_BG = require('@/assets/images/Kingdoms-and-Prophets-Moses-Tree-Fire.jpg');
const TABLET_BG = require('@/assets/images/Tablet.png');

const SFX_MAP = {
  righteous: require('@/assets/audio/righteous.wav'),
  pragmatic: require('@/assets/audio/pragmatic.wav'),
  rebel: require('@/assets/audio/rebel.wav'),
};

// Phase A "scene intake" - minimum cinematic breath before text burns in. The
// pull-back starts at CHOICE TIME (masking generation latency), and the text
// gate is max(minIntake, contentReady): snappy when the API is fast, seamless
// when it lags (see ARCHITECTURE.md Scene Intro Camera).
const INTAKE_MS = 5000;

const GOLD = '#D4AF37';
const HEADER_H = Platform.OS === 'web' ? 78 : 110; // word logo 54px + padding
const ZONE_TOP = HEADER_H + 14;
const ZONE_BOTTOM = 60;
const MOBILE_MAX = 768;

// Ampersand pipeline: headings only (Playfair ligature), never body text (ARCHITECTURE.md).
const amp = (s: string) => s.replace(/\band\b/gi, '&');

// Strip inline mood tags for display; the TTS pipeline consumes them server-side.
function stripMoodTags(text: string): string {
  return text.replace(/\[[a-z]+\]/gi, '').replace(/ {2,}/g, ' ').trim();
}

// ── Atmospheric dust motes: cross-platform Animated (no canvas, no deps) ──
function Motes({ width, height, active }: { width: number; height: number; active: boolean }) {
  // Use percentage values to avoid clustering at 0,0 if initial layout returns width/height as 0
  const motes = React.useRef(
    Array.from({ length: 14 }, () => ({
      xPct: Math.random(),
      yPct: Math.random(),
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.3,
      drift: new Animated.Value(0),
      dur: 9000 + Math.random() * 9000,
    }))
  ).current;

  React.useEffect(() => {
    if (!active) return;
    const loops = motes.map((m) =>
      Animated.loop(
        Animated.timing(m.drift, { toValue: 1, duration: m.dur, easing: Easing.linear, useNativeDriver: true })
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active]);

  if (!active) return null;
  // Fallback to absolute screen bounds if layout dimensions are not resolved yet
  const actualW = width || 1024;
  const actualH = height || 768;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 2 }]} pointerEvents="none">
      {motes.map((m, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: m.xPct * actualW,
            top: m.yPct * actualH,
            width: m.size,
            height: m.size,
            borderRadius: m.size,
            backgroundColor: GOLD,
            opacity: m.drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, m.opacity, 0] }),
            transform: [
              { translateX: m.drift.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
              { translateY: m.drift.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < MOBILE_MAX;

  const sceneTitle = useGameStore((s) => s.sceneTitle);
  const sceneText = useGameStore((s) => s.sceneText);
  const sceneImage = useGameStore((s) => s.sceneImage);
  const choices = useGameStore((s) => s.choices);
  const righteous = useGameStore((s) => s.righteous);
  const pragmatic = useGameStore((s) => s.pragmatic);
  const rebel = useGameStore((s) => s.rebel);
  const ttsEnabled = useGameStore((s) => s.ttsEnabled);
  const isLoading = useGameStore((s) => s.isLoading);
  const adGateTriggered = useGameStore((s) => s.adGateTriggered);

  const makeChoice = useGameStore((s) => s.makeChoice);
  const setTtsEnabled = useGameStore((s) => s.setTtsEnabled);
  const unlockPremium = useGameStore((s) => s.unlockPremium);
  const resetGame = useGameStore((s) => s.resetGame);
  const loadProgress = useGameStore((s) => s.loadProgress);
  const saveProgress = useGameStore((s) => s.saveProgress);

  const [hoveredChoiceId, setHoveredChoiceId] = React.useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = React.useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      // @ts-ignore subscription/function across RN versions
      sub?.remove ? sub.remove() : sub?.();
    };
  }, []);

  // ── Sentences: mood tags stripped, quotes detected for the divine-voice style ──
  const sentences = React.useMemo(() => {
    if (!sceneText) return [];
    return stripMoodTags(sceneText)
      .split(/(?<=[.!?"”])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ text: s, quote: /^["“]/.test(s) }));
  }, [sceneText]);

  // ── Camera: cam = intro pull-back, amb = ambient Ken Burns loop ──
  const cam = React.useRef(new Animated.Value(0)).current;
  const amb = React.useRef(new Animated.Value(0)).current;

  const [revealed, setRevealed] = React.useState(0);
  const [choicesShown, setChoicesShown] = React.useState(false);
  // Anims are created at render time (keyed to the sentence list), so sentence
  // nodes always mount; the effect below only DRIVES them. Never gate rendering
  // on state that an animation callback owns.
  const sentAnims = React.useMemo(() => sentences.map(() => new Animated.Value(0)), [sentences]);

  // Set at choice-tap so the intake gate counts from the TAP, not from when the
  // generated scene arrives - the camera has already been moving over the fetch.
  const tapAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!sentences.length) return;
    setRevealed(0);
    setChoicesShown(false);
    setSelectedChoiceId(null);
    const tapAt = tapAtRef.current;
    tapAtRef.current = null;
    // Initial mount starts punched-in; after a tap the camera is mid-pull
    // already (started in onChoose), so continue from wherever it is.
    if (!tapAt) cam.setValue(0);
    amb.setValue(0);
    const remaining = tapAt ? Math.max(tapAt + INTAKE_MS - Date.now(), 400) : INTAKE_MS;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const startReading = () => {
      if (cancelled) return;
      if (!reduceMotion) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(amb, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(amb, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        ).start();
      }
      const revealNext = (i: number) => {
        if (cancelled) return;
        if (i >= sentences.length) {
          setChoicesShown(true);
          return;
        }
        Animated.timing(sentAnims[i], {
          toValue: 1,
          duration: reduceMotion ? 200 : 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // colour interpolation needs the JS driver
        }).start();
        setRevealed(i + 1);
        const words = sentences[i].text.split(/\s+/).length;
        const dwell = reduceMotion ? 140 : Math.max(1100, words * 260);
        timers.push(setTimeout(() => revealNext(i + 1), dwell));
      };
      revealNext(0);
    };

    if (reduceMotion) {
      cam.setValue(1);
      startReading();
    } else {
      // Visual pull-back runs on the Animated timeline; the reveal is scheduled
      // by a plain timer so a missed animation callback can never stall the text.
      Animated.timing(cam, {
        toValue: 1,
        duration: remaining,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      timers.push(setTimeout(startReading, remaining + 100));
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [sentences, reduceMotion]);

  const bgScale = Animated.add(
    cam.interpolate({ inputRange: [0, 1], outputRange: [1.28, 1.06] }),
    amb.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] })
  );
  const bgTranslateX = Animated.add(
    cam.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.12, 0] }),
    amb.interpolate({ inputRange: [0, 1], outputRange: [0, 10] })
  );
  const bgTranslateY = amb.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  // Choice tap: punch the camera back in on the CURRENT art instantly and start
  // a slow drift while the next scene generates. The moment feels directed, not
  // loading. When the scene lands, the reveal effect finishes the pull-back.
  const onChoose = async (choice: Choice) => {
    setSelectedChoiceId(choice.id);

    // 1. Tactile haptic feedback
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      console.warn('Haptics failed:', e);
    }

    // 2. Play thematic SFX
    try {
      let soundAsset = null;
      if (choice.alignmentEffect?.righteous) {
        soundAsset = SFX_MAP.righteous;
      } else if (choice.alignmentEffect?.pragmatic) {
        soundAsset = SFX_MAP.pragmatic;
      } else if (choice.alignmentEffect?.rebel) {
        soundAsset = SFX_MAP.rebel;
      }

      if (soundAsset) {
        const { sound } = await Audio.Sound.createAsync(soundAsset);
        await sound.playAsync();
        // Unload sound from memory after playback is completed
        setTimeout(() => {
          sound.unloadAsync().catch(() => {});
        }, 2500);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    if (!reduceMotion) {
      tapAtRef.current = Date.now();
      cam.setValue(0);
      Animated.timing(cam, {
        toValue: 0.6,
        duration: INTAKE_MS * 2, // deliberately slow - still moving whenever the scene lands
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    makeChoice(choice);
  };

  // ── Header (Z2) ──
  const renderHeader = () => (
    <View style={[styles.header, isMobile && styles.headerM]}>
      <View style={styles.brand}>
        <Image source={WORD_LOGO} style={isMobile ? styles.wordLogoM : styles.wordLogo} resizeMode="contain" />
        <Text style={[styles.tagline, isMobile && { fontSize: 8, letterSpacing: 2 }]}>Divergent Prophecies</Text>
      </View>
      <View style={styles.headerActions}>
        {isLoading && <ActivityIndicator size="small" color={GOLD} style={{ marginRight: 4 }} />}
        <TouchableOpacity style={styles.headerBtn} onPress={saveProgress} accessibilityLabel="Save">
          <Ionicons name="save-outline" size={18} color="#E2E2E9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={loadProgress} accessibilityLabel="Load">
          <Ionicons name="folder-open-outline" size={18} color="#E2E2E9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerBtn, ttsEnabled && styles.headerBtnActive]}
          onPress={() => setTtsEnabled(!ttsEnabled)}
          accessibilityLabel="Toggle narration"
        >
          <Ionicons name={ttsEnabled ? 'volume-high-outline' : 'volume-mute-outline'} size={18} color={ttsEnabled ? GOLD : '#E2E2E9'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setSettingsOpen(true)} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={18} color="#E2E2E9" />
        </TouchableOpacity>
        {!isMobile && (
          <View style={styles.chapterBadge}>
            <Ionicons name="bookmark-outline" size={12} color={GOLD} />
            <Text style={styles.chapterBadgeText}> Ch. I</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ── Story zone (Z3, left 50% desktop / full-width top-anchored mobile) ──
  const renderStory = () => (
    <View
      style={[
        styles.storyZone,
        isMobile
          ? { left: 0, width: '100%', top: HEADER_H, bottom: 230, justifyContent: 'flex-start', paddingTop: 16, paddingLeft: 20, paddingRight: 20 }
          : null,
      ]}
      pointerEvents="box-none"
    >
      <Text style={[styles.storyTitle, isMobile && { fontSize: 22 }]}>{amp(sceneTitle)}</Text>
      <View style={styles.divider} />
      <ScrollView style={styles.storyScroll} showsVerticalScrollIndicator={false}>
        {sentences.map((sentence, i) => {
          const a = sentAnims[i];
          if (!a) return null;
          const isCurrent = i === revealed - 1;
          const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
          // Burn-in: ember -> parchment (quotes cool into warm gold instead).
          const color = a.interpolate({
            inputRange: [0, 0.45, 1],
            outputRange: sentence.quote ? ['#FFD700', '#E8B830', '#D9BC6B'] : ['#FF8A2B', '#D89033', '#E4E0D6'],
          });
          return (
            <Animated.View key={i} style={[{ opacity: a, transform: [{ translateY }] }, sentence.quote && styles.quoteWrap]}>
              <Animated.Text
                // @ts-ignore web-only className for the gold read-along shimmer
                className={Platform.OS === 'web' && isCurrent ? 'sentence-current' : undefined}
                style={[styles.body, sentence.quote && styles.quoteText, { color }]}
              >
                {sentence.text}{' '}
              </Animated.Text>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Choices (Z4, right 50% desktop / stacked bottom mobile). No alignment telegraph. ──
  const renderChoices = () => (
    <View
      style={[
        styles.choicesZone,
        isMobile
          ? { left: 0, right: 0, top: undefined, bottom: 48, justifyContent: 'flex-end', paddingHorizontal: 16, gap: 8 }
          : null,
      ]}
      pointerEvents="box-none"
    >
      {choices.map((choice, idx) => {
        const isSelected = selectedChoiceId === choice.id;
        const isAnySelected = selectedChoiceId !== null;
        const isDimmed = isAnySelected && !isSelected;

        return (
          <TouchableOpacity
            key={choice.id}
            activeOpacity={0.7}
            disabled={isAnySelected || isLoading}
            style={[
              styles.choiceBtn,
              !isMobile && { marginLeft: idx === 1 ? 24 : idx === 2 ? 12 : 0 },
              choicesShown && styles.choiceRevealed,
              isSelected && styles.choiceSelected,
              isDimmed && styles.choiceDimmed,
              hoveredChoiceId === choice.id && !isAnySelected && styles.choiceHover,
            ]}
            onPress={() => onChoose(choice)}
            // @ts-ignore web hover handlers
            onMouseEnter={() => !isAnySelected && setHoveredChoiceId(choice.id)}
            onMouseLeave={() => setHoveredChoiceId(null)}
          >
            <Text style={styles.choiceText} numberOfLines={2}>
              {choice.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Settings overlay (Z100): the stone tablet's one sanctioned home ──
  const settingsRow = (icon: any, label: string, onPress: () => void, active = false) => (
    <TouchableOpacity key={label} style={[styles.settingsBtn, active && styles.settingsBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? GOLD : '#E2E2E9'} />
      <Text style={[styles.settingsBtnText, active && { color: GOLD }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={styles.settingsOverlay}>
      <Image source={TABLET_BG} style={styles.settingsTablet} resizeMode="contain" />
      <View style={styles.settingsPanel}>
        <Text style={styles.settingsTitle}>{amp('Covenant and Order')}</Text>
        <View style={styles.divider} />
        {settingsRow('save-outline', 'SAVE PROGRESS', () => { saveProgress(); })}
        {settingsRow('folder-open-outline', 'LOAD PROGRESS', () => { loadProgress(); setSettingsOpen(false); })}
        {settingsRow(ttsEnabled ? 'volume-high-outline' : 'volume-mute-outline', ttsEnabled ? 'VOICE NARRATION: ON' : 'VOICE NARRATION: OFF', () => setTtsEnabled(!ttsEnabled), ttsEnabled)}
        {settingsRow('refresh-outline', 'RESTART ODYSSEY', () => { resetGame(); setSettingsOpen(false); })}
        {settingsRow('close-outline', 'RESUME', () => setSettingsOpen(false))}
      </View>
    </View>
  );

  const stat = (label: string, value: number, color: string) => (
    <Text key={label} style={[styles.stat, { color }]}>
      {label} {value}
    </Text>
  );

  return (
    <View style={styles.root}>
      <Head>
        <title>Covenant Odyssey - Divergent Prophecies</title>
      </Head>
      {Platform.OS === 'web' && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:wght@400;700;800&display=swap');
          @keyframes sentence-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          .sentence-current {
            background: linear-gradient(120deg,#8B6914 0%,#C9950A 25%,#D4AF37 50%,#C9950A 75%,#8B6914 100%);
            background-size: 200% auto;
            -webkit-background-clip: text; background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: sentence-shimmer 3.5s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) { .sentence-current { animation: none; } }
        `,
          }}
        />
      )}

      {/* Z0: scene art with intro pull-back + Ken Burns */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale: bgScale }, { translateX: bgTranslateX }, { translateY: bgTranslateY }] },
        ]}
      >
        <ImageBackground
          source={sceneImage ? { uri: sceneImage } : DEFAULT_BG}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={isMobile ? { left: '66.6%', top: '50%' } : 'center'}
          transition={600}
        />
      </Animated.View>

      {/* Z1: readability gradient - left fade desktop, top+bottom fade mobile */}
      {isMobile ? (
        <LinearGradient
          colors={['rgba(10,10,12,0.8)', 'rgba(10,10,12,0.15)', 'rgba(10,10,12,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : (
        <LinearGradient
          colors={['rgba(10,10,12,0.86)', 'rgba(10,10,12,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
          pointerEvents="none"
        />
      )}

      {/* Z2: dust motes */}
      <Motes width={width} height={height} active={!reduceMotion} />

      {renderHeader()}
      {renderStory()}
      {renderChoices()}

      {/* Z4: stats footer - bottom CENTRE (tooltips clip off-screen when cornered) */}
      <View style={styles.footer} pointerEvents="none">
        <View style={styles.statsRow}>
          {stat('RGT', righteous, '#68D391')}
          {stat('PRG', pragmatic, GOLD)}
          {stat('RBL', rebel, '#C0C0C0')}
        </View>
      </View>

      {/* Z50: paywall */}
      {adGateTriggered && (
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallCard}>
            <Image source={FULL_LOGO} style={styles.paywallLogo} resizeMode="contain" />
            <Text style={styles.paywallTitle}>Covenant Odyssey Premium</Text>
            <Text style={styles.paywallText}>
              You have reached the end of the free trial. Continue your journey and unlock full access to Kingdoms & Prophets, Genesis, and Fulfillment chapters.
            </Text>
            <TouchableOpacity style={styles.premiumCTA} onPress={unlockPremium}>
              <LinearGradient colors={[GOLD, '#856A1E']} style={styles.premiumGradient}>
                <Text style={styles.premiumCTAText}>Unlock Premium Access ($5.99)</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adButton} onPress={unlockPremium}>
              <Ionicons name="play-circle-outline" size={16} color="#A0A0B0" />
              <Text style={styles.adButtonText}> Watch Rewarded Ad (Unlock Scene)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paywallReset} onPress={resetGame}>
              <Text style={styles.paywallResetText}>Restart Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Z100: settings - hard snap, no transition (locked rule) */}
      {settingsOpen && renderSettings()}
    </View>
  );
}

const FONT_BODY = Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif';
const FONT_HEAD = Platform.OS === 'web' ? "'Playfair Display', serif" : 'serif';
const FONT_MONO = Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0C' },

  gradient: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '55%', zIndex: 1 },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: HEADER_H,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingLeft: 48,
    paddingTop: Platform.OS === 'web' ? 0 : 36,
  },
  headerM: { paddingLeft: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordLogo: { height: 54, width: 180 },
  wordLogoM: { height: 40, width: 132 },
  tagline: {
    fontFamily: FONT_BODY,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(212,175,55,0.7)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: {
    backgroundColor: 'rgba(84,67,56,0.75)',
    borderLeftWidth: 3,
    borderLeftColor: '#544338',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: { borderLeftColor: GOLD, backgroundColor: 'rgba(133,106,30,0.75)' },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,12,0.75)',
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chapterBadgeText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FONT_MONO,
    textTransform: 'uppercase',
  },

  // Story zone (left 50%, vertically centred - locked desktop rules)
  storyZone: {
    position: 'absolute',
    top: ZONE_TOP,
    bottom: ZONE_BOTTOM,
    left: 0,
    width: '50%',
    zIndex: 3,
    justifyContent: 'center',
    paddingLeft: 48,
    paddingRight: 40,
  },
  storyTitle: {
    fontFamily: FONT_HEAD,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  divider: { width: 56, height: 3, backgroundColor: GOLD, marginBottom: 16 },
  storyScroll: { flexGrow: 0 },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 27,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  // Divine voice / quotes: italic behind a gold left border (left-border system)
  quoteWrap: { borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 12, marginTop: 8, marginBottom: 6 },
  quoteText: { fontStyle: 'italic' },

  // Choices zone (left 52% -> right 2%, space-around - locked desktop rules)
  choicesZone: {
    position: 'absolute',
    top: ZONE_TOP,
    bottom: ZONE_BOTTOM,
    left: '52%',
    right: '2%',
    zIndex: 4,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  choiceBtn: {
    backgroundColor: 'rgba(35,35,51,0.75)',
    borderLeftWidth: 3,
    borderLeftColor: '#6A6A7A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '92%',
    alignSelf: 'flex-start',
    opacity: 0,
    transform: [{ translateX: 20 }],
  },
  choiceRevealed: { opacity: 1, transform: [{ translateX: 0 }] },
  choiceHover: {
    borderLeftColor: GOLD,
    backgroundColor: 'rgba(84,67,56,0.75)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  choiceSelected: {
    borderLeftColor: GOLD,
    backgroundColor: 'rgba(84,67,56,0.9)',
    opacity: 1,
    transform: [{ scale: 0.98 }, { translateX: 0 }],
  },
  choiceDimmed: {
    opacity: 0.35,
    transform: [{ translateX: 0 }],
  },
  choiceText: { color: '#E2E2E9', fontSize: 14, fontWeight: '600', lineHeight: 20, fontFamily: FONT_BODY },

  // Stats footer - bottom centre (a cornered row clips its tooltips off-screen)
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, paddingVertical: 14, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 20 },
  stat: { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // Settings overlay (Z100) - stone tablet's one sanctioned home
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: 'rgba(10,10,12,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTablet: { position: 'absolute', width: '100%', height: '100%', opacity: 0.9 },
  settingsPanel: { alignItems: 'stretch', gap: 10, width: 300, maxWidth: '80%' },
  settingsTitle: {
    fontFamily: FONT_HEAD,
    fontSize: 26,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 4,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(23,23,33,0.75)',
    borderLeftWidth: 3,
    borderLeftColor: '#544338',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingsBtnActive: { borderLeftColor: GOLD, backgroundColor: 'rgba(133,106,30,0.4)' },
  settingsBtnText: {
    color: '#E2E2E9',
    fontFamily: FONT_BODY,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Paywall
  paywallOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paywallCard: {
    width: '100%',
    maxWidth: 480,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: 'rgba(23,23,33,0.96)',
  },
  paywallLogo: { width: 200, height: 120, marginBottom: 12 },
  paywallTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 12, fontFamily: FONT_HEAD },
  paywallText: { fontSize: 14, color: '#A0A0B0', lineHeight: 22, textAlign: 'center', marginBottom: 28, fontFamily: FONT_BODY },
  premiumCTA: { width: '100%', overflow: 'hidden', marginBottom: 12 },
  premiumGradient: { paddingVertical: 14, alignItems: 'center' },
  premiumCTAText: { color: '#FFF', fontSize: 16, fontWeight: '800', fontFamily: FONT_BODY },
  adButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(84,67,56,0.75)',
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#544338',
    marginBottom: 20,
  },
  adButtonText: { color: '#A0A0B0', fontSize: 14, fontWeight: '700', fontFamily: FONT_BODY },
  paywallReset: { padding: 8 },
  paywallResetText: { color: '#8A8A9E', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline', fontFamily: FONT_BODY },
});
