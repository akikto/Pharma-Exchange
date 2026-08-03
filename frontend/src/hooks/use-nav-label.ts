import { useTranslation } from 'react-i18next';
import type { NavLabelKey, AdminLabelKey } from '@/components/layout/nav-config';

export function useNavLabel(labelKey: NavLabelKey | AdminLabelKey, ns: 'nav' = 'nav') {
  const { t } = useTranslation();
  return {
    primary: t(`${ns}.${labelKey}`),
    subtitle: t(`${ns}.${labelKey}Sub`),
  };
}

export function useBilingualPair(primaryKey: string, subtitleKey?: string) {
  const { t } = useTranslation();
  return {
    primary: t(primaryKey),
    subtitle: subtitleKey ? t(subtitleKey) : undefined,
  };
}
