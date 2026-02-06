import { ethers } from 'ethers';

export const contractAddress = "0x5730092193e9754335dae6d9c77c6769bef0fb3a"; 

export const formatEther = (wei: ethers.BigNumberish) => {
  return ethers.formatEther(wei);
};

export const parseEther = (eth: string) => {
  return ethers.parseEther(eth);
};

export const formatTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};