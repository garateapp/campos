<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class HarvestCollection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'worker_id',
        'card_id',
        'date',
        'harvest_container_id',
        'quantity',
        'field_id',
        'is_bin_completed',
        'manual_bin_units',
    ];

    protected $casts = [
        'is_bin_completed' => 'boolean',
        'manual_bin_units' => 'integer',
    ];

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function harvestContainer(): BelongsTo
    {
        return $this->belongsTo(HarvestContainer::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }
}
