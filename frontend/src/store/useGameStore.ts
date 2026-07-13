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
  makeChoice: (choice: Choice) => void;
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

export const useGameStore = create<GameState>((set) => ({
  ...INITIAL_SCENE,
  history: [],
  righteous: 0,
  pragmatic: 0,
  rebel: 0,
  isPremiumUnlocked: false,
  ttsEnabled: true,
  isLoading: false,
  adGateTriggered: false,

  makeChoice: (choice: Choice) =>
    set((state) => {
      // Calculate new alignments
      const righteous = state.righteous + (choice.alignmentEffect.righteous || 0);
      const pragmatic = state.pragmatic + (choice.alignmentEffect.pragmatic || 0);
      const rebel = state.rebel + (choice.alignmentEffect.rebel || 0);

      // Simple mock scene progression
      const nextSceneId = choice.nextSceneId || (parseInt(state.sceneId) + 1).toString();
      const sceneIdNum = parseInt(nextSceneId);

      // Check for ad gate
      if (sceneIdNum > 4 && !state.isPremiumUnlocked) {
        return {
          adGateTriggered: true,
        };
      }

      // Generate dynamic scene content (placeholder for Gemini output)
      let sceneTitle = `Scene ${nextSceneId}`;
      let sceneText = '';
      let nextChoices: Choice[] = [];

      if (nextSceneId === '2') {
        sceneTitle = 'The Whispering Oaks';
        sceneText = `You have moved deeper into the oak forests. Your choice to ${choice.text.toLowerCase().replace('.', '')} has shifted the balance. Righteous: ${righteous}, Pragmatic: ${pragmatic}, Rebel: ${rebel}. Eliab watches you closely. What will you do next?`;
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
        sceneText = 'The air is thick with tension. Campfires dot the opposing ridges. A silent messenger delivers a scroll. It contains terms of surrender or a duel to the death. The choice is yours to counsel the king.';
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
        sceneText = 'You stand before the giant champion of Gath. His shield glimmers in the morning sun. Behind you, the hosts of Israel hold their breath. This is the fourth scene—the limit of the free tier. Your final strike awaits.';
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
        sceneText = `You have unlocked the premium story! You are moving further along the path of alignment. Righteousness: ${righteous}, Pragmatism: ${pragmatic}, Rebellion: ${rebel}. The odyssey continues.`;
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

      return {
        sceneId: nextSceneId,
        sceneTitle,
        sceneText,
        choices: nextChoices,
        history: [...state.history, choice.id],
        righteous,
        pragmatic,
        rebel,
      };
    }),

  setTtsEnabled: (enabled: boolean) => set({ ttsEnabled: enabled }),
  unlockPremium: () => set({ isPremiumUnlocked: true, adGateTriggered: false }),
  resetGame: () => set({ ...INITIAL_SCENE, history: [], righteous: 0, pragmatic: 0, rebel: 0, adGateTriggered: false }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  triggerAdGate: (triggered: boolean) => set({ adGateTriggered: triggered }),
}));
