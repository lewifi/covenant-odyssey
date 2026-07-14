import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, Choice } from '@/store/useGameStore';

const LOGO_IMAGE = require('@/../../assets/images/Kingdoms-and-Prophets-Logo-Transparent.png');
const DEFAULT_BG = require('@/../../assets/images/Kingdoms-and-Prophets-Moses-Tree-Fire.jpg');

export default function GameScreen() {
  const { width, height } = useWindowDimensions();

  // Zustand Store Hooks
  const sceneTitle = useGameStore((state) => state.sceneTitle);
  const sceneText = useGameStore((state) => state.sceneText);
  const sceneImage = useGameStore((state) => state.sceneImage);
  const choices = useGameStore((state) => state.choices);
  const righteous = useGameStore((state) => state.righteous);
  const pragmatic = useGameStore((state) => state.pragmatic);
  const rebel = useGameStore((state) => state.rebel);
  const ttsEnabled = useGameStore((state) => state.ttsEnabled);
  const isLoading = useGameStore((state) => state.isLoading);
  const adGateTriggered = useGameStore((state) => state.adGateTriggered);
  const sceneId = useGameStore((state) => state.sceneId);

  const makeChoice = useGameStore((state) => state.makeChoice);
  const setTtsEnabled = useGameStore((state) => state.setTtsEnabled);
  const unlockPremium = useGameStore((state) => state.unlockPremium);
  const resetGame = useGameStore((state) => state.resetGame);
  const loadProgress = useGameStore((state) => state.loadProgress);
  const saveProgress = useGameStore((state) => state.saveProgress);

  const [hoveredChoiceId, setHoveredChoiceId] = React.useState<string | null>(null);

  // ─── HEADER BAR (Z-Layer 2) ───
  const renderHeader = () => (
    <View style={styles.headerBar}>
      <Text style={styles.headerLogo}>COVENANT ODYSSEY</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerBtn} onPress={saveProgress}>
          <Text style={styles.headerBtnText}>💾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={loadProgress}>
          <Text style={styles.headerBtnText}>📂</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerBtn, ttsEnabled && styles.headerBtnActive]}
          onPress={() => setTtsEnabled(!ttsEnabled)}
        >
          <Text style={styles.headerBtnText}>{ttsEnabled ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>⚙</Text>
        </TouchableOpacity>
        <View style={styles.chapterBadge}>
          <Text style={styles.chapterBadgeText}>⛪ Ch. {sceneId}</Text>
        </View>
      </View>
    </View>
  );

  // ─── STORY TEXT ZONE (Z-Layer 3, left 40%) ───
  const renderStoryText = () => (
    <View style={styles.storyZone}>
      <Text style={styles.storyTitle}>{sceneTitle}</Text>
      <View style={styles.storyDivider} />
      <ScrollView style={styles.storyScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.storyBody}>{sceneText}</Text>
      </ScrollView>
    </View>
  );

  // ─── FOOTER BAR (Z-Layer 4) ───
  const renderFooter = () => (
    <View style={styles.footerBar}>
      {/* Choice Buttons */}
      <View style={styles.choicesContainer}>
        {choices.map((choice) => (
          <TouchableOpacity
            key={choice.id}
            style={[
              styles.choiceButton,
              hoveredChoiceId === choice.id && styles.choiceButtonHovered,
            ]}
            onPress={() => makeChoice(choice)}
            onMouseEnter={() => setHoveredChoiceId(choice.id)}
            onMouseLeave={() => setHoveredChoiceId(null)}
          >
            <View style={styles.choiceInner}>
              <Text style={styles.choiceText}>{choice.text}</Text>
              <View style={styles.choiceBadges}>
                {choice.alignmentEffect.righteous ? (
                  <Text style={styles.choiceEffectBadge}>+Righteous</Text>
                ) : null}
                {choice.alignmentEffect.pragmatic ? (
                  <Text style={styles.choiceEffectBadge}>+Pragmatic</Text>
                ) : null}
                {choice.alignmentEffect.rebel ? (
                  <Text style={styles.choiceEffectBadge}>+Rebel</Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alignment Stats Row */}
      <View style={styles.alignmentRow}>
        <View style={styles.alignmentStat}>
          <Text style={[styles.alignmentLabel, { color: '#68D391' }]}>🕊️ R:{righteous}</Text>
        </View>
        <View style={styles.alignmentStat}>
          <Text style={[styles.alignmentLabel, { color: '#D4AF37' }]}>🛡️ P:{pragmatic}</Text>
        </View>
        <View style={styles.alignmentStat}>
          <Text style={[styles.alignmentLabel, { color: '#C0C0C0' }]}>⚔️ R:{rebel}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Google Fonts Loader (Web) */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400&display=swap');
        `}} />
      )}

      {/* Z-Layer 0: Full-bleed scene art (or dark fallback) */}
      <View style={styles.artLayer}>
        <ImageBackground
          source={sceneImage ? { uri: sceneImage } : DEFAULT_BG}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </View>

      {/* Z-Layer 1: Left gradient overlay for text readability */}
      <LinearGradient
        colors={['rgba(10, 10, 12, 0.75)', 'rgba(10, 10, 12, 0.45)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.textGradientOverlay}
      />

      {/* Z-Layer 2: Header Bar */}
      {renderHeader()}

      {/* Z-Layer 3 & 4: Content */}
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <Image
            source={LOGO_IMAGE}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 24 }} />
          <Text style={styles.loadingText}>Weaving the tapestry of scripture...</Text>
        </View>
      ) : (
        <>
          {/* Z-Layer 3: Story Text Zone */}
          {renderStoryText()}

          {/* Z-Layer 4: Footer Bar */}
          {renderFooter()}
        </>
      )}

      {/* Z-Layer 5: Paywall / Ad Gate Overlay */}
      {adGateTriggered && (
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallCard}>
            <Text style={styles.paywallIcon}>👑</Text>
            <Text style={styles.paywallTitle}>Covenant Odyssey Premium</Text>
            <Text style={styles.paywallText}>
              You have reached the end of the free trial. To continue your journey and unlock full access to Kingdoms & Prophets, Genesis, and Fulfillment chapters:
            </Text>

            <TouchableOpacity style={styles.premiumCTA} onPress={unlockPremium}>
              <LinearGradient
                colors={['#D4AF37', '#856A1E']}
                style={styles.premiumGradient}
              >
                <Text style={styles.premiumCTAText}>Unlock Premium Access ($5.99)</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.adButton} onPress={unlockPremium}>
              <Text style={styles.adButtonText}>📺 Watch Rewarded Ad (Unlock Scene)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.paywallReset} onPress={resetGame}>
              <Text style={styles.paywallResetText}>Restart Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── ROOT ───
  root: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },

  // ─── Z-LAYER 0: ART BASE ───
  artLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  // ─── Z-LAYER 1: TEXT READABILITY GRADIENT ───
  textGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '50%',
    zIndex: 1,
  },

  // ─── Z-LAYER 2: HEADER BAR ───
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 12 : 48,
    paddingBottom: 10,
  },
  headerLogo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    backgroundColor: 'rgba(84, 67, 56, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#3F3F54',
  },
  headerBtnActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(133, 106, 30, 0.75)',
  },
  headerBtnText: {
    fontSize: 16,
  },
  chapterBadge: {
    backgroundColor: 'rgba(10, 10, 12, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#544338',
  },
  chapterBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
    textTransform: 'uppercase',
  },

  // ─── Z-LAYER 3: STORY TEXT ZONE ───
  storyZone: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 60 : 100,
    left: 16,
    bottom: 220,
    width: '38%',
    zIndex: 3,
    justifyContent: 'center',
    paddingRight: 8,
  },
  storyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', serif" : 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  storyDivider: {
    height: 3,
    width: 60,
    backgroundColor: '#D4AF37',
    marginBottom: 16,
  },
  storyScroll: {
    flex: 1,
  },
  storyBody: {
    fontSize: 16,
    color: '#E2E2E9',
    lineHeight: 28,
    fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },

  // ─── Z-LAYER 4: FOOTER BAR ───
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 12 : 32,
    paddingTop: 8,
  },
  choicesContainer: {
    gap: 8,
    marginBottom: 8,
  },
  choiceButton: {
    backgroundColor: 'rgba(35, 35, 51, 0.75)',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4A4A5A',
  },
  choiceButtonHovered: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(84, 67, 56, 0.75)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  choiceInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceText: {
    color: '#E2E2E9',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
  },
  choiceBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  choiceEffectBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    color: '#D4AF37',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 0,
    overflow: 'hidden',
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
    textTransform: 'uppercase',
  },

  // ─── ALIGNMENT STATS ROW ───
  alignmentRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
  },
  alignmentStat: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  alignmentLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
    letterSpacing: 1,
  },

  // ─── LOADING OVERLAY ───
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(10, 10, 12, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 200,
    height: 200,
  },
  loadingText: {
    color: '#8A8A9E',
    marginTop: 16,
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
  },

  // ─── Z-LAYER 5: PAYWALL OVERLAY ───
  paywallOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paywallCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 0,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(23, 23, 33, 0.95)',
  },
  paywallIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', serif" : 'serif',
  },
  paywallText: {
    fontSize: 14,
    color: '#A0A0B0',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
  },
  premiumCTA: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  premiumGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  premiumCTAText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
  },
  adButton: {
    width: '100%',
    backgroundColor: 'rgba(84, 67, 56, 0.75)',
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#544338',
    marginBottom: 20,
  },
  adButtonText: {
    color: '#A0A0B0',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
  },
  paywallReset: {
    padding: 8,
  },
  paywallResetText: {
    color: '#8A8A9E',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'web' ? "'Outfit', sans-serif" : 'sans-serif',
  },
});
