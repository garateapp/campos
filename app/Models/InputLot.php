<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InputLot extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'input_id',
        'quantity',
        'remaining_quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
    ];

    public function input(): BelongsTo
    {
        return $this->belongsTo(Input::class);
    }

    public function usageLots(): HasMany
    {
        return $this->hasMany(InputUsageLot::class);
    }
}
