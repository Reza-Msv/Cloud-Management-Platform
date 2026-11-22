<?php

use App\Http\Controllers\CustomerServiceController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CustomerServiceController::class, 'index'])->name('customers.index');
Route::patch('/services/{serviceId}/status', [CustomerServiceController::class, 'updateStatus'])->name('services.updateStatus');
