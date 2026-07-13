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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore, Choice } from '@/store/useGameStore';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CYOAScreen() {
  const { width } = useWindowDimensions();
  const theme = useTheme();

  // Zustand Store Hooks
  const sceneTitle = useGameStore((state) => state.sceneTitle);
  const sceneText = useGameStore((state) => state.sceneText);
  const choices = useGameStore((state) => state.choices);
  const righteous = useGameStore((state) => state.righteous);
  const pragmatic = useGameStore((state) => state.pragmatic);
  const rebel = useGameStore((state) => state.rebel);
  const ttsEnabled = useGameStore((state) => state.ttsEnabled);
  const isLoading = useGameStore((state) => state.isLoading);
  const adGateTriggered = useGameStore((state) => state.adGateTriggered);
  
  const makeChoice = useGameStore((state) => state.makeChoice);
  const setTtsEnabled = useGameStore((state) => state.setTtsEnabled);
  const unlockPremium = useGameStore((state) => state.unlockPremium);
  const resetGame = useGameStore((state) => state.resetGame);
  const loadProgress = useGameStore((state) => state.loadProgress);

  const isLargeScreen = width >= 768;

  // Render alignment pill/badge
  const renderAlignmentMeters = () => (
    <View style={styles.alignmentContainer}>
      <View style={[styles.alignmentPill, { backgroundColor: '#1A3038' }]}>
        <Text style={[styles.alignmentLabel, { color: '#68D391' }]}>🕊️ Righteous</Text>
        <Text style={styles.alignmentVal}>{righteous}</Text>
      </View>
      <View style={[styles.alignmentPill, { backgroundColor: '#2D281E' }]}>
        <Text style={[styles.alignmentLabel, { color: '#F6AD55' }]}>🛡️ Pragmatic</Text>
        <Text style={styles.alignmentVal}>{pragmatic}</Text>
      </View>
      <View style={[styles.alignmentPill, { backgroundColor: '#321D1D' }]}>
        <Text style={[styles.alignmentLabel, { color: '#FC8181' }]}>⚔️ Rebel</Text>
        <Text style={styles.alignmentVal}>{rebel}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0F0F12', '#171721', '#09090C']}
      style={styles.container}
    >
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        `}} />
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>COVENANT ODYSSEY</Text>
            <Text style={styles.subtitle}>Choose Your Biblical Destiny</Text>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={[styles.ttsButton, ttsEnabled && styles.ttsButtonActive]}
              onPress={() => setTtsEnabled(!ttsEnabled)}
            >
              <Text style={styles.ttsButtonText}>{ttsEnabled ? '🔊 Narration: On' : '🔇 Narration: Off'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loadButton} onPress={loadProgress}>
              <Text style={styles.loadButtonText}>📂 Load Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alignment Tracker */}
        {renderAlignmentMeters()}

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loaderText}>Weaving the tapestry of scripture...</Text>
          </View>
        ) : (
          <View style={[styles.mainLayout, isLargeScreen && styles.mainLayoutSplit]}>
            
            {/* Left Column: Visual Artwork panel */}
            <View style={[styles.artCard, isLargeScreen && styles.artCardSplit]}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.15)', 'rgba(23, 23, 33, 0.85)']}
                style={styles.artInner}
              >
                <Text style={styles.artPlaceholderIcon}>📜</Text>
                <Text style={styles.artPlaceholderText}>{sceneTitle}</Text>
                <View style={styles.artDivider} />
                <Text style={styles.artHint}>Generative Scene Art</Text>
              </LinearGradient>
            </View>

            {/* Right Column: Narrative & Choice Actions */}
            <View style={[styles.narrativeCard, isLargeScreen && styles.narrativeCardSplit]}>
              <Text style={styles.sceneTitle}>{sceneTitle}</Text>
              <Text style={styles.sceneText}>{sceneText}</Text>

              {/* Choices Rendering */}
              <View style={styles.choicesContainer}>
                {choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={styles.choiceButton}
                    onPress={() => makeChoice(choice)}
                  >
                    <View style={styles.choiceInner}>
                      <Text style={styles.choiceText}>{choice.text}</Text>
                      {choice.alignmentEffect.righteous && (
                        <Text style={styles.choiceEffectBadge}>+Righteous</Text>
                      )}
                      {choice.alignmentEffect.pragmatic && (
                        <Text style={styles.choiceEffectBadge}>+Pragmatic</Text>
                      )}
                      {choice.alignmentEffect.rebel && (
                        <Text style={styles.choiceEffectBadge}>+Rebel</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        )}
      </ScrollView>

      {/* Ad Gate / Premium Paywall Overlay */}
      {adGateTriggered && (
        <View style={styles.paywallOverlay}>
          <LinearGradient
            colors={['#171721', '#0F0F12']}
            style={styles.paywallCard}
          >
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
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? 'Playfair Display, serif' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0B0',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : 'sans-serif',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  ttsButton: {
    backgroundColor: '#2A2A38',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#3F3F54',
  },
  ttsButtonActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#322E22',
  },
  ttsButtonText: {
    color: '#E2E2E9',
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#2A2A38',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#3F3F54',
  },
  resetButtonText: {
    color: '#E2E2E9',
    fontSize: 12,
    fontWeight: '600',
  },
  loadButton: {
    backgroundColor: '#2A2A38',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#3F3F54',
  },
  loadButtonText: {
    color: '#E2E2E9',
    fontSize: 12,
    fontWeight: '600',
  },
  alignmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 10,
    flexWrap: 'wrap',
  },
  alignmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 0,
    flex: 1,
    minWidth: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  alignmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : 'sans-serif',
  },
  alignmentVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : 'sans-serif',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loaderText: {
    color: '#8A8A9E',
    marginTop: 16,
    fontSize: 15,
  },
  mainLayout: {
    gap: 20,
  },
  mainLayoutSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  artCard: {
    borderRadius: 0,
    overflow: 'hidden',
    height: 320,
    backgroundColor: '#1E1E2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  artCardSplit: {
    flex: 1,
    height: 480,
  },
  artInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  artPlaceholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  artPlaceholderText: {
    color: '#E2E2E9',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display, serif' : 'serif',
  },
  artDivider: {
    height: 2,
    width: 60,
    backgroundColor: '#D4AF37',
    marginVertical: 16,
  },
  artHint: {
    color: '#8A8A9E',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : 'sans-serif',
  },
  narrativeCard: {
    backgroundColor: '#171721',
    borderRadius: 0,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  narrativeCardSplit: {
    flex: 1.2,
    minHeight: 480,
  },
  sceneTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Playfair Display, serif' : 'serif',
  },
  sceneText: {
    fontSize: 16,
    color: '#D1D1E0',
    lineHeight: 28,
    fontWeight: '400',
    marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : 'sans-serif',
  },
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    backgroundColor: '#232333',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#303046',
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
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : 'sans-serif',
  },
  choiceEffectBadge: {
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(212,175,55,0.15)',
    color: '#D4AF37',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 0,
    overflow: 'hidden',
  },
  paywallOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    borderWidth: 1,
    borderColor: '#D4AF37',
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
  },
  paywallText: {
    fontSize: 14,
    color: '#A0A0B0',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
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
  },
  adButton: {
    width: '100%',
    backgroundColor: '#232333',
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303046',
    marginBottom: 20,
  },
  adButtonText: {
    color: '#A0A0B0',
    fontSize: 14,
    fontWeight: '700',
  },
  paywallReset: {
    padding: 8,
  },
  paywallResetText: {
    color: '#8A8A9E',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
