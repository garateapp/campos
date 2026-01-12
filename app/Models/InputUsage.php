<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InputUsage extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'input_id',
        'activity_id',
        'field_id',
        'usage_date',
        'quantity',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'usage_date' => 'date',
        'quantity' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    /**
     * Get the input that was used.
     */
    public function input(): BelongsTo
    {
        return $this->belongsTo(Input::class);
    }

    /**
     * Get the activity this usage is linked to.
     */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /**
     * Get the field where input was used.
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Boot the model - auto-calculate cost if not provided.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($usage) {
            if (!$usage->total_cost && $usage->input_id) {
                $input = Input::find($usage->input_id);
                if ($input && $input->unit_cost) {
                    $usage->total_cost = $usage->quantity * $input->unit_cost;
                }
            }
        });
    }

    public function lotUsages(): HasMany
    {
        return $this->hasMany(InputUsageLot::class);
    }
}
