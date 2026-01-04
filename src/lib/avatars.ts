export const AVATARS = {
  male: [
    { id: 'boy1', emoji: '👨‍🎓', label: 'Student' },
    { id: 'boy2', emoji: '👨‍💻', label: 'Developer' },
    { id: 'boy3', emoji: '👨‍🔬', label: 'Scientist' },
    { id: 'boy4', emoji: '👨‍🎨', label: 'Artist' },
    { id: 'boy5', emoji: '🧑‍🚀', label: 'Astronaut' },
  ],
  female: [
    { id: 'girl1', emoji: '👩‍🎓', label: 'Student' },
    { id: 'girl2', emoji: '👩‍💻', label: 'Developer' },
    { id: 'girl3', emoji: '👩‍🔬', label: 'Scientist' },
    { id: 'girl4', emoji: '👩‍🎨', label: 'Artist' },
    { id: 'girl5', emoji: '👩‍🚀', label: 'Astronaut' },
  ],
};

export const getAllAvatars = () => {
  return [...AVATARS.male, ...AVATARS.female];
};

export const getAvatarById = (id: string) => {
  const allAvatars = getAllAvatars();
  return allAvatars.find(avatar => avatar.id === id) || allAvatars[0];
};
