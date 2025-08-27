const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Machine {
  macNo: string;
  gameName: string;
  camera0Url: string;
  camera1Url: string;
  imgFileName: string;
  machineType: string;
  protocolVersion: number;
  price: number;
  during: number;
  netStatus: number;
  inRoomCustomerAmount: number;
  enableGiveNewPlayer: boolean;
  isDemo: boolean;
  winAmount: number;
  isWinGetGold: number;
  catchGoods: any;
  ballCount: number;
  xbiZhong: number;
}

export interface LobbyData {
  machines: Machine[] | null;
  banners: string[] | null;
  categories: any[] | null;
}

export const roomService = {
  async getLobbyData(): Promise<LobbyData | null> {
    try {
      const response = await fetch('/api/lobby');

      const data = await response.json();
      if (data.code === 20000) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch lobby data:', error);
      return null;
    }
  },

  async getRoomRankings(macAddr: string, jwt: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/get_mac_ranking?mac_addr=${macAddr}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      const data = await response.json();
      if (data.code === 20000) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch room rankings:', error);
      return null;
    }
  },

  async getRoomCatchRecords(macAddr: string, jwt: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/get_success_records_in_room?mac_addr=${macAddr}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      const data = await response.json();
      if (data.code === 20000) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch room catch records:', error);
      return null;
    }
  },
};
