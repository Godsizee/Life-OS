export interface ShoppingItem {
	id: string;
	workspace_id: string;
	name: string;
	qty: number;
	unit: string | null;
	checked: boolean;
	position: number;
	added_by: string;
	created_at: string;
	updated_at: string;
}
