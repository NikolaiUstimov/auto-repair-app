import {RepairType} from './repair-type'

export type RepairFormValue = Omit<RepairType, 'id' | 'number' | 'createdAt'>
