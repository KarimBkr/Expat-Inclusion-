export interface AppNotification {
  id: string;
  type: string;
  data: {
    type: string;
    message: string;
    url: string;
    booking_id?: number;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  data: {
    data: AppNotification[];
  };
  unread_count: number;
}
