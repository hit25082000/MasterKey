import { Entity } from "./entity";

export interface Role extends Entity {
    id: string;
    name: string;
    permissions: string[];
}

