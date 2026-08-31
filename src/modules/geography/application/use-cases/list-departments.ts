import { departments } from "../../domain/lookup";
import type { Department } from "../../domain/place";

export const listDepartments = () => async (): Promise<Department[]> => departments();
