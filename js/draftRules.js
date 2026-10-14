export const DRAFT_SEQUENCE = [
  // 1페이즈 밴 (각 팀 3밴)
  { team: 'blue', action: 'ban', slotIndex: 0, label: '블루 1차 밴' },
  { team: 'red', action: 'ban', slotIndex: 0, label: '레드 1차 밴' },
  { team: 'blue', action: 'ban', slotIndex: 1, label: '블루 2차 밴' },
  { team: 'red', action: 'ban', slotIndex: 1, label: '레드 2차 밴' },
  { team: 'blue', action: 'ban', slotIndex: 2, label: '블루 3차 밴' },
  { team: 'red', action: 'ban', slotIndex: 2, label: '레드 3차 밴' },
  // 1페이즈 픽 (3픽씩)
  { team: 'blue', action: 'pick', slotIndex: 0, label: '블루 1픽' },
  { team: 'red', action: 'pick', slotIndex: 0, label: '레드 1픽' },
  { team: 'red', action: 'pick', slotIndex: 1, label: '레드 2픽' },
  { team: 'blue', action: 'pick', slotIndex: 1, label: '블루 2픽' },
  { team: 'blue', action: 'pick', slotIndex: 2, label: '블루 3픽' },
  { team: 'red', action: 'pick', slotIndex: 2, label: '레드 3픽' },
  // 2페이즈 밴 (각 팀 2밴)
  { team: 'red', action: 'ban', slotIndex: 3, label: '레드 4차 밴' },
  { team: 'blue', action: 'ban', slotIndex: 3, label: '블루 4차 밴' },
  { team: 'red', action: 'ban', slotIndex: 4, label: '레드 5차 밴' },
  { team: 'blue', action: 'ban', slotIndex: 4, label: '블루 5차 밴' },
  // 2페이즈 픽 (남은 2픽씩)
  { team: 'red', action: 'pick', slotIndex: 3, label: '레드 4픽' },
  { team: 'blue', action: 'pick', slotIndex: 3, label: '블루 4픽' },
  { team: 'blue', action: 'pick', slotIndex: 4, label: '블루 5픽' },
  { team: 'red', action: 'pick', slotIndex: 4, label: '레드 5픽' },
];
