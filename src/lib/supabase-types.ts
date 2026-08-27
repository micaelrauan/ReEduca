export type Database = {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					email: string;
					name: string | null;
					image_url: string | null;
					region: string | null;
					bio: string | null;
					last_seen_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					name?: string | null;
					image_url?: string | null;
					region?: string | null;
					bio?: string | null;
					last_seen_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					name?: string | null;
					image_url?: string | null;
					region?: string | null;
					bio?: string | null;
					last_seen_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			listings: {
				Row: {
					id: string;
					title: string;
					description: string | null;
					category: string;
					deal: string;
					condition: string;
					price: number | null;
					wanted: string | null;
					region: string | null;
					status: string;
					photo_urls: unknown;
					seller_name: string | null;
					seller_rating: number | null;
					fav_count: number;
					owner_id: string;
					deleted_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					category: string;
					deal: string;
					condition: string;
					price?: number | null;
					wanted?: string | null;
					region?: string | null;
					status?: string;
					photo_urls?: unknown;
					seller_name?: string | null;
					seller_rating?: number | null;
					fav_count?: number;
					owner_id: string;
					deleted_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					category?: string;
					deal?: string;
					condition?: string;
					price?: number | null;
					wanted?: string | null;
					region?: string | null;
					status?: string;
					photo_urls?: unknown;
					seller_name?: string | null;
					seller_rating?: number | null;
					fav_count?: number;
					owner_id?: string;
					deleted_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'listings_owner_id_fkey';
						columns: ['owner_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			favorites: {
				Row: {
					owner_id: string;
					listing_id: string;
					created_at: string;
				};
				Insert: {
					owner_id: string;
					listing_id: string;
					created_at?: string;
				};
				Update: {
					owner_id?: string;
					listing_id?: string;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'favorites_listing_id_fkey';
						columns: ['listing_id'];
						isOneToOne: false;
						referencedRelation: 'listings';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'favorites_owner_id_fkey';
						columns: ['owner_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			messages: {
				Row: {
					id: string;
					text: string;
					sender_id: string;
					recipient_id: string;
					listing_id: string | null;
					read_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					text: string;
					sender_id: string;
					recipient_id: string;
					listing_id?: string | null;
					read_at?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					text?: string;
					sender_id?: string;
					recipient_id?: string;
					listing_id?: string | null;
					read_at?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'messages_listing_id_fkey';
						columns: ['listing_id'];
						isOneToOne: false;
						referencedRelation: 'listings';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'messages_sender_id_fkey';
						columns: ['sender_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'messages_recipient_id_fkey';
						columns: ['recipient_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			ratings: {
				Row: {
					id: string;
					stars: number;
					comment: string | null;
					author_id: string;
					target_id: string;
					listing_id: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					stars: number;
					comment?: string | null;
					author_id: string;
					target_id: string;
					listing_id?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					stars?: number;
					comment?: string | null;
					author_id?: string;
					target_id?: string;
					listing_id?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'ratings_listing_id_fkey';
						columns: ['listing_id'];
						isOneToOne: false;
						referencedRelation: 'listings';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'ratings_author_id_fkey';
						columns: ['author_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'ratings_target_id_fkey';
						columns: ['target_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			reports: {
				Row: {
					id: string;
					reason: string;
					kind: string;
					reporter_id: string | null;
					listing_id: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					reason: string;
					kind: string;
					reporter_id?: string | null;
					listing_id?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					reason?: string;
					kind?: string;
					reporter_id?: string | null;
					listing_id?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'reports_listing_id_fkey';
						columns: ['listing_id'];
						isOneToOne: false;
						referencedRelation: 'listings';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'reports_reporter_id_fkey';
						columns: ['reporter_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
	};
};
