import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_CONFIG } from '../constants/api.constants';
import { UserMasterData } from '../../models/user-management.models';

const DEFAULT_MASTERS: UserMasterData = {
  role: ['Admin', 'OperationManager', 'Recommender'],
};

const MASTER_STORAGE_KEY = 'ems.master-data';

@Injectable({
  providedIn: 'root',
})
export class UserMasterDataService {
  private readonly http = inject(HttpClient);
  private readonly mastersStore = signal<UserMasterData>(this.restoreMasters() ?? DEFAULT_MASTERS);
  private readonly loadingStore = signal(false);
  private readonly errorStore = signal<string | null>(null);

  readonly masters = this.mastersStore.asReadonly();
  readonly loading = this.loadingStore.asReadonly();
  readonly error = this.errorStore.asReadonly();
  readonly hasLoadedFromApi = computed(() => this.error() === null && this.loading() === false);

  async loadMasters(): Promise<UserMasterData> {
    this.loadingStore.set(true);
    this.errorStore.set(null);

    try {
      const masters = await firstValueFrom(
        this.http.get<UserMasterData>(`${API_CONFIG.baseUrl}${API_CONFIG.mastersPath}`),
      );
      const mergedMasters = this.mergeMasters(masters, this.masters());

      this.mastersStore.set(mergedMasters);
      this.persistMasters(mergedMasters);

      return mergedMasters;
    } catch {
      this.errorStore.set('Unable to load master values. Using local defaults.');

      return this.masters();
    } finally {
      this.loadingStore.set(false);
    }
  }

  addRole(role: string): boolean {
    return this.addMasterValue('role', role);
  }

  private addMasterValue<K extends keyof UserMasterData>(key: K, value: string): boolean {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return false;
    }

    const currentMasters = this.masters();
    if (currentMasters[key].some((item) => item.toLowerCase() === normalizedValue.toLowerCase())) {
      return false;
    }

    const nextMasters = {
      ...currentMasters,
      [key]: [...currentMasters[key], normalizedValue],
    } as UserMasterData;

    this.mastersStore.set(nextMasters);
    this.persistMasters(nextMasters);

    return true;
  }

  private mergeMasters(primary: UserMasterData, secondary: UserMasterData): UserMasterData {
    return {
      role: this.mergeList(primary.role, secondary.role),
    };
  }

  private mergeList(primary: string[], secondary: string[]): string[] {
    const merged: string[] = [];
    const seen = new Set<string>();

    for (const value of [...primary, ...secondary]) {
      const normalizedValue = String(value).trim();

      if (!normalizedValue) {
        continue;
      }

      const canonical = normalizedValue.toLowerCase();
      if (seen.has(canonical)) {
        continue;
      }

      seen.add(canonical);
      merged.push(normalizedValue);
    }

    return merged;
  }

  private persistMasters(masters: UserMasterData): void {
    localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(masters));
  }

  private restoreMasters(): UserMasterData | null {
    const storedMasters = localStorage.getItem(MASTER_STORAGE_KEY);

    if (!storedMasters) {
      return null;
    }

    try {
      const parsedMasters = JSON.parse(storedMasters) as UserMasterData;

      return {
        role: Array.isArray(parsedMasters.role) ? parsedMasters.role.map((value) => String(value)) : DEFAULT_MASTERS.role,
      };
    } catch {
      localStorage.removeItem(MASTER_STORAGE_KEY);

      return null;
    }
  }
}
