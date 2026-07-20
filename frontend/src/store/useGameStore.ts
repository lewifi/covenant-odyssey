import { create } from 'zustand';

export interface Choice {
  id: string;
  text: string;
  alignmentEffect: {
    righteous?: number;
    pragmatic?: number;
    rebel?: number;
  };
  nextSceneId?: string;
}

export interface GameState {
  userId: string;
  sceneId: string;
  sceneTitle: string;
  sceneText: string;
  sceneImage: string | null;
  choices: Choice[];
  history: string[]; // Stack of chosen choice IDs
  righteous: number;
  pragmatic: number;
  rebel: number;
  isPremiumUnlocked: boolean;
  ttsEnabled: boolean;
  isLoading: boolean;
  adGateTriggered: boolean;

  // Actions
  makeChoice: (choice: Choice) => Promise<void>;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  setTtsEnabled: (enabled: boolean) => void;
  unlockPremium: () => void;
  resetGame: () => void;
  setLoading: (loading: boolean) => void;
  triggerAdGate: (triggered: boolean) => void;
}

const INITIAL_SCENE = {
  sceneId: '1',
  sceneTitle: 'The Prophet\'s Call',
  sceneText: 'The dust settles over the valley of Elah. You stand at the precipice, holding a smooth stone in your palm. A voice echoes in your mind, demanding a sacrifice of comfort. Eliab, the king\'s eldest, watches you from the tents with jealousy. Do you step forward, or withdraw into the shadow of the tribe?',
  sceneImage: null,
  choices: [
    {
      id: 'step_forward',
      text: 'Step forward into the light of the valley, offering yourself to the path.',
      alignmentEffect: { righteous: 5 },
      nextSceneId: '2',
    },
    {
      id: 'withdraw_shadow',
      text: 'Withdraw back into the shadows of the tents to secure your tribe\'s safety.',
      alignmentEffect: { pragmatic: 5 },
      nextSceneId: '2',
    },
    {
      id: 'confront_eliab',
      text: 'Confront Eliab directly, demanding he take responsibility.',
      alignmentEffect: { rebel: 5 },
      nextSceneId: '2',
    },
  ],
};

const API_BASE = (typeof __DEV__ !== 'undefined' && __DEV__)
  ? 'http://localhost:8787'
  : 'https://covenantodyssey.lewihirvela.com';

export const useGameStore = create<GameState>((set) => ({
  userId: 'eliab_dev_user',
  ...INITIAL_SCENE,
  history: [],
  righteous: 0,
  pragmatic: 0,
  rebel: 0,
  isPremiumUnlocked: false,
  ttsEnabled: true,
  isLoading: false,
  adGateTriggered: false,

  makeChoice: async (choice: Choice) => {
    const { sceneId, history, righteous, pragmatic, rebel, isPremiumUnlocked, isLoading } = useGameStore.getState();
    if (isLoading) return;

    // Calculate new alignments
    const nextRighteous = righteous + (choice.alignmentEffect.righteous || 0);
    const nextPragmatic = pragmatic + (choice.alignmentEffect.pragmatic || 0);
    const nextRebel = rebel + (choice.alignmentEffect.rebel || 0);

    const nextSceneId = choice.nextSceneId || (parseInt(sceneId) + 1).toString();
    const sceneIdNum = parseInt(nextSceneId);

    // Chapter 1 (all 20 scenes + the Go Wild epilogue) is fully free - no gate.
    // Monetization begins at Chapter 2 per the Islands & Sea model: the paywall
    // overlay stays wired for that moment, it just never fires in Chapter 1.

    useGameStore.setState({ isLoading: true });
    const newHistory = [...history, choice.id];

    try {
      const response = await fetch(`${API_BASE}/api/generate-scene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneId: nextSceneId,
          history: newHistory,
          righteous: nextRighteous,
          pragmatic: nextPragmatic,
          rebel: nextRebel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Worker API returned status ${response.status}`);
      }

      const data = await response.json() as {
        sceneTitle: string;
        sceneText: string;
        choices: Choice[];
        sceneImage?: string;
      };

      useGameStore.setState({
        sceneId: nextSceneId,
        sceneTitle: data.sceneTitle,
        sceneText: data.sceneText,
        choices: data.choices,
        sceneImage: data.sceneImage || null,
        history: newHistory,
        righteous: nextRighteous,
        pragmatic: nextPragmatic,
        rebel: nextRebel,
        isLoading: false,
      });

      // Sync state to D1 Database in the background
      useGameStore.getState().saveProgress().catch(err => console.error("Auto-save failed:", err));

    } catch (error) {
      console.warn("Worker API error, using local fallback content:", error);
      
      let sceneTitle = `Scene ${nextSceneId}`;
      let sceneText = '';
      let nextChoices: Choice[] = [];

      if (nextSceneId === '2') {
        sceneTitle = 'The Whispering Oaks';
        sceneText = `You have moved deeper into the oak forests. Your choice to ${choice.text.toLowerCase().replace('.', '')} has shifted the balance. Righteous: ${nextRighteous}, Pragmatic: ${nextPragmatic}, Rebel: ${nextRebel}. Eliab watches you closely. (Running in offline fallback mode).`;
        nextChoices = [
          {
            id: 'pray_guidance',
            text: 'Seek guidance in prayer beneath the ancient oak.',
            alignmentEffect: { righteous: 5 },
            nextSceneId: '3',
          },
          {
            id: 'fortify_camp',
            text: 'Set guards and secure the perimeter.',
            alignmentEffect: { pragmatic: 5 },
            nextSceneId: '3',
          },
          {
            id: 'scout_ahead',
            text: 'Slip away into the night to scout the Philistine lines alone.',
            alignmentEffect: { rebel: 5 },
            nextSceneId: '3',
          },
        ];
      } else if (nextSceneId === '3') {
        sceneTitle = 'The Eve of Battle';
        sceneText = 'The air is thick with tension. Campfires dot the opposing ridges. A silent messenger delivers a scroll. It contains terms of surrender or a duel to the death. The choice is yours to counsel the king. (Running in offline fallback mode).';
        nextChoices = [
          {
            id: 'counsel_faith',
            text: 'Counsel the King to trust in the Covenant and fight.',
            alignmentEffect: { righteous: 5 },
            nextSceneId: '4',
          },
          {
            id: 'counsel_terms',
            text: 'Propose accepting the terms of tribute to spare blood.',
            alignmentEffect: { pragmatic: 5 },
            nextSceneId: '4',
          },
          {
            id: 'counsel_assassinate',
            text: 'Propose a covert assassination of the giant champion.',
            alignmentEffect: { rebel: 5 },
            nextSceneId: '4',
          },
        ];
      } else if (nextSceneId === '4') {
        sceneTitle = 'The Crucible';
        sceneText = 'You stand before the giant champion of Gath. His shield glimmers in the morning sun. Behind you, the hosts of Israel hold their breath. This is the fourth scene - the limit of the free tier. Your final strike awaits. (Running in offline fallback mode).';
        nextChoices = [
          {
            id: 'strike_righteous',
            text: 'Aim for his forehead with absolute faith in the stone.',
            alignmentEffect: { righteous: 10 },
            nextSceneId: '5',
          },
          {
            id: 'strike_pragmatic',
            text: 'Feign retreat and draw him into an ambush of archers.',
            alignmentEffect: { pragmatic: 10 },
            nextSceneId: '5',
          },
          {
            id: 'strike_rebel',
            text: 'Throw away the sling, draw the giant\'s own sword, and charge.',
            alignmentEffect: { rebel: 10 },
            nextSceneId: '5',
          },
        ];
      } else {
        sceneTitle = `Chapter II: Scene ${nextSceneId}`;
        sceneText = `You have unlocked the premium story! You are moving further along the path of alignment. Righteousness: ${nextRighteous}, Pragmatism: ${nextPragmatic}, Rebellion: ${nextRebel}. The odyssey continues. (Running in offline fallback mode).`;
        nextChoices = [
          {
            id: 'continue_journey',
            text: 'Continue the odyssey.',
            alignmentEffect: {},
            nextSceneId: (sceneIdNum + 1).toString(),
          },
          {
            id: 'restart',
            text: 'Restart from the beginning.',
            alignmentEffect: {},
            nextSceneId: '1',
          },
        ];
      }

      useGameStore.setState({
        sceneId: nextSceneId,
        sceneTitle,
        sceneText,
        choices: nextChoices,
        history: newHistory,
        righteous: nextRighteous,
        pragmatic: nextPragmatic,
        rebel: nextRebel,
        isLoading: false,
      });

      // Sync state to D1 Database in the background
      useGameStore.getState().saveProgress().catch(err => console.error("Auto-save failed:", err));
    }
  },

  saveProgress: async () => {
    const { userId, sceneId, history, righteous, pragmatic, rebel } = useGameStore.getState();
    try {
      const response = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sceneId,
          history,
          righteous,
          pragmatic,
          rebel,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save state. Status: ${response.status}`);
      }
    } catch (error) {
      console.warn("D1 save failed:", error);
    }
  },

  loadProgress: async () => {
    const { userId } = useGameStore.getState();
    useGameStore.setState({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE}/api/load?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load state. Status: ${response.status}`);
      }
      const data = await response.json() as {
        sceneId: string;
        history: string[];
        righteous: number;
        pragmatic: number;
        rebel: number;
      };

      const sceneResponse = await fetch(`${API_BASE}/api/generate-scene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneId: data.sceneId,
          history: data.history,
          righteous: data.righteous,
          pragmatic: data.pragmatic,
          rebel: data.rebel,
        }),
      });

      if (!sceneResponse.ok) {
        throw new Error(`Failed to generate loaded scene. Status: ${sceneResponse.status}`);
      }

      const sceneData = await sceneResponse.json() as {
        sceneTitle: string;
        sceneText: string;
        choices: Choice[];
        sceneImage?: string;
      };

      useGameStore.setState({
        sceneId: data.sceneId,
        sceneTitle: sceneData.sceneTitle,
        sceneText: sceneData.sceneText,
        choices: sceneData.choices,
        sceneImage: sceneData.sceneImage || null,
        history: data.history,
        righteous: data.righteous,
        pragmatic: data.pragmatic,
        rebel: data.rebel,
        isLoading: false,
      });

    } catch (error) {
      console.warn("D1 load failed:", error);
      useGameStore.setState({ isLoading: false });
    }
  },

  setTtsEnabled: (enabled: boolean) => set({ ttsEnabled: enabled }),
  unlockPremium: () => set({ isPremiumUnlocked: true, adGateTriggered: false }),
  resetGame: () => set({ ...INITIAL_SCENE, history: [], righteous: 0, pragmatic: 0, rebel: 0, adGateTriggered: false }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  triggerAdGate: (triggered: boolean) => set({ adGateTriggered: triggered }),
}));
