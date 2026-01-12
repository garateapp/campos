<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InputUsageLot extends Model
{
    use HasFactory;

    protected $fillable = [
        'input_usage_id',
        'input_lot_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function usage(): BelongsTo
    {
        return $this->belongsTo(InputUsage::class, 'input_usage_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(InputLot::class, 'input_lot_id');
    }
}
