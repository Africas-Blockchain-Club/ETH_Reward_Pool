export interface ContractInfo {
  address: string;
  abi: any[];
}

export interface RoundInfo {
  roundId: number;
  roundStart: number;
  participants: string[];
  poolBalance: string;
  isRoundOpen: boolean;
  timeLeft: number;
}

export interface Participant {
  address: string;
  hasJoined: boolean;
}