<?php

declare(strict_types=1);

final class AlchemizeCatalogPricingService
{
    public const SELLABLE_STATUSES = ['ACTIVE', 'CUSTOM_SOW_ONLY', 'MANUAL_REVIEW'];

    public function calculate(string $serviceKey, string $tierKey, array $inputs = []): array
    {
        $key = strtolower(trim($serviceKey . ':' . $tierKey));
        $manual = static fn (string $label = 'Manual Review Required'): array => [
            'pricing_type' => 'MANUAL_REVIEW', 'amount' => null, 'display_price' => $label,
            'manual_review_required' => true, 'final' => false,
        ];
        $fixed = static fn (float $amount, string $frequency = 'ONE_TIME'): array => [
            'pricing_type' => 'FIXED', 'amount' => round($amount, 2),
            'display_price' => '$' . number_format($amount, 2), 'billing_frequency' => $frequency,
            'manual_review_required' => false, 'final' => true,
        ];

        if ($key === 'bookkeeping:cleanup') {
            if (!empty($inputs['severe_cleanup']) || !empty($inputs['reconstruction'])) return $manual();
            $months = max(1, (int) ($inputs['months_behind'] ?? 1));
            return $fixed(250 + max($months - 1, 0) * 125);
        }
        if ($key === 'bookkeeping:monthly') {
            $transactions = max(0, (int) ($inputs['transactions'] ?? 0));
            $accounts = max(0, (int) ($inputs['accounts'] ?? 0));
            if ($transactions > 600 || $accounts > 6 || !empty($inputs['complexity_flag'])) return $manual('Custom SOW');
            if ($transactions <= 100 && $accounts <= 2) return $fixed(249, 'MONTHLY') + ['tier_key' => 'essentials'];
            if ($transactions <= 300 && $accounts <= 4) return $fixed(399, 'MONTHLY') + ['tier_key' => 'growth'];
            return $fixed(599, 'MONTHLY') + ['tier_key' => 'operations'];
        }
        if ($key === 'payroll:processing') {
            $employees = max(1, (int) ($inputs['employees'] ?? 1));
            if ($employees > 30) return $manual('Custom SOW');
            if ($employees <= 5) return $fixed(99, 'MONTHLY') + ['tier_key' => '1-5-employees'];
            if ($employees <= 15) return $fixed(149, 'MONTHLY') + ['tier_key' => '6-15-employees'];
            return $fixed(199, 'MONTHLY') + ['tier_key' => '16-30-employees'];
        }
        if ($key === 'translation:general') {
            return $fixed(max(35, ((int) ($inputs['source_words'] ?? 0)) * .15));
        }
        if ($key === 'translation:certified') {
            $subtotal = max(1, (int) ($inputs['pages'] ?? 1)) * 45;
            return $fixed(!empty($inputs['rush']) ? $subtotal * 1.5 : $subtotal);
        }
        if ($key === 'tax-preparation:standard-1040') {
            if (!empty($inputs['complexity_flag'])) return $manual();
            return $fixed(299 + max(0, (int) ($inputs['rentals'] ?? 0)) * 125 + max(0, (int) ($inputs['additional_states'] ?? 0)) * 75);
        }
        if ($key === 'apostille:facilitation') return $fixed(149 + max(0, (int) ($inputs['documents'] ?? 1) - 1) * 40);
        if ($key === 'administrative-support:additional-time') return $fixed(max(0.5, (float) ($inputs['hours'] ?? .5)) * 60, 'HOURLY');

        $fixedCatalog = [
            'website-design:launch' => 1250, 'website-design:growth' => 1850,
            'administrative-support:essentials' => 275, 'administrative-support:support' => 525,
            'administrative-support:partner' => 950,
        ];
        if (isset($fixedCatalog[$key])) return $fixed($fixedCatalog[$key], str_starts_with($key, 'administrative') ? 'MONTHLY' : 'ONE_TIME');
        if (str_contains($key, 'custom') || !empty($inputs['custom_sow'])) return $manual('Custom SOW');
        return $manual();
    }

    public function assertSelectable(array $service, ?array $tier = null): void
    {
        $status = strtoupper((string) ($tier['status'] ?? $service['catalog_status'] ?? $service['status'] ?? ''));
        $active = (bool) ($tier['active_flag'] ?? $service['active_flag'] ?? false);
        if (!$active || !in_array($status, self::SELLABLE_STATUSES, true)) {
            throw new AlchemizeRequestException(422, 'SERVICE_NOT_SELECTABLE', 'This catalog item is not eligible for ordinary sale.');
        }
    }
}
