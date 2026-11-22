<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer & Service Management — Cloud Management Platform</title>
    <style>
        :root {
            --deep-ocean: #0B3C5D;
            --sky-blue: #4DA8DA;
            --bg-light: #F4F6F9;
            --card-bg: #FFFFFF;
            --text-main: #1D2D44;
            --text-muted: #6B7C93;
            --border-color: #E2E8F0;
            --success-bg: #DEF7EC;
            --success-text: #03543F;
            --warning-bg: #FEF08A;
            --warning-text: #713F12;
            --danger-bg: #FDE8E8;
            --danger-text: #9B1C1C;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        body {
            background-color: var(--bg-light);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        header {
            background: var(--deep-ocean);
            color: #FFFFFF;
            padding: 1rem 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-content {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand-title {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .brand-badge {
            background: rgba(77, 168, 218, 0.2);
            color: var(--sky-blue);
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
        }

        main {
            flex: 1;
            max-width: 1100px;
            width: 100%;
            margin: 2rem auto;
            padding: 0 1rem;
        }

        .card {
            background: var(--card-bg);
            border-radius: 8px;
            border: 1px solid var(--border-color);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 1.5rem;
            overflow: hidden;
        }

        .card-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
            background: #FAFAFB;
        }

        .card-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--deep-ocean);
        }

        .card-desc {
            font-size: 0.825rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
        }

        .card-body {
            padding: 1.5rem;
        }

        .search-form {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }

        .input-group {
            flex: 1;
        }

        input[type="number"] {
            width: 100%;
            padding: 0.65rem 0.85rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 0.9rem;
            color: var(--text-main);
            outline: none;
            transition: border-color 0.15s ease-in-out;
        }

        input[type="number"]:focus {
            border-color: var(--sky-blue);
            box-shadow: 0 0 0 3px rgba(77, 168, 218, 0.2);
        }

        button.btn {
            padding: 0.65rem 1.25rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: background 0.15s ease-in-out;
        }

        .btn-primary {
            background: var(--deep-ocean);
            color: #FFFFFF;
        }

        .btn-primary:hover {
            background: #092c44;
        }

        .btn-sm {
            padding: 0.35rem 0.75rem;
            font-size: 0.75rem;
            border-radius: 4px;
        }

        .btn-toggle-suspend {
            background: #F59E0B;
            color: #FFFFFF;
        }

        .btn-toggle-suspend:hover {
            background: #D97706;
        }

        .btn-toggle-activate {
            background: #10B981;
            color: #FFFFFF;
        }

        .btn-toggle-activate:hover {
            background: #059669;
        }

        .alert {
            padding: 0.85rem 1.25rem;
            border-radius: 6px;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .alert-error {
            background: var(--danger-bg);
            color: var(--danger-text);
            border: 1px solid #F8B4B4;
        }

        .alert-success {
            background: var(--success-bg);
            color: var(--success-text);
            border: 1px solid #84E1BC;
        }

        .profile-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
        }

        .profile-item label {
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            color: var(--text-muted);
            margin-bottom: 0.25rem;
            letter-spacing: 0.05em;
        }

        .profile-item span {
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--text-main);
        }

        table.services-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }

        table.services-table th {
            text-align: left;
            padding: 0.75rem 1rem;
            background: #FAFAFB;
            color: var(--text-muted);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border-color);
        }

        table.services-table td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
        }

        table.services-table tr:last-child td {
            border-bottom: none;
        }

        .badge {
            display: inline-block;
            padding: 0.2rem 0.55rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: capitalize;
        }

        .badge-active {
            background: var(--success-bg);
            color: var(--success-text);
        }

        .badge-suspended {
            background: var(--warning-bg);
            color: var(--warning-text);
        }

        .empty-state {
            padding: 2.5rem 1rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        footer {
            text-align: center;
            padding: 1.5rem;
            font-size: 0.75rem;
            color: var(--text-muted);
            border-top: 1px solid var(--border-color);
            background: #FFFFFF;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="brand-title">
                Cloud Management Platform
                <span class="brand-badge">PHP / Laravel Module</span>
            </div>
            <div style="font-size: 0.8rem; color: #CBD5E1;">
                Upstream Core: Django REST API
            </div>
        </div>
    </header>

    <main>
        {{-- Flash messages --}}
        @if(session('success'))
            <div class="alert alert-success">
                ✓ {{ session('success') }}
            </div>
        @endif

        @if(session('error') || (isset($error) && $error))
            <div class="alert alert-error">
                ⚠ {{ session('error') ?? $error }}
            </div>
        @endif

        {{-- Customer ID Lookup Form --}}
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Customer Inquiry & Service Management</h2>
                <p class="card-desc">Look up customer records and manage cloud service lifecycle via Django Core API</p>
            </div>
            <div class="card-body">
                <form action="{{ route('customers.index') }}" method="GET" class="search-form">
                    <div class="input-group">
                        <input
                            type="number"
                            name="customer_id"
                            id="customer_id"
                            placeholder="Enter Customer ID (e.g. 28)"
                            value="{{ old('customer_id', $customerId ?? '') }}"
                            required
                            min="1"
                        />
                    </div>
                    <button type="submit" class="btn btn-primary">
                        Retrieve Customer
                    </button>
                </form>
            </div>
        </div>

        {{-- Customer Profile Details --}}
        @if(isset($customer) && $customer)
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Customer Profile: {{ e($customer['first_name'] ?? '') }} {{ e($customer['last_name'] ?? '') }}</h2>
                    <p class="card-desc">Customer ID: #{{ e($customer['id']) }}</p>
                </div>
                <div class="card-body">
                    <div class="profile-grid">
                        <div class="profile-item">
                            <label>First Name</label>
                            <span>{{ e($customer['first_name'] ?? '—') }}</span>
                        </div>
                        <div class="profile-item">
                            <label>Last Name</label>
                            <span>{{ e($customer['last_name'] ?? '—') }}</span>
                        </div>
                        <div class="profile-item">
                            <label>Email Address</label>
                            <span>{{ e($customer['email'] ?? '—') }}</span>
                        </div>
                        <div class="profile-item">
                            <label>Phone Number</label>
                            <span>{{ e($customer['phone'] ?? '—') }}</span>
                        </div>
                        <div class="profile-item">
                            <label>Registered Date</label>
                            <span>{{ isset($customer['created_at']) ? date('Y-m-d H:i:s', strtotime($customer['created_at'])) : '—' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Services List Belonging to Customer --}}
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Provisioned Cloud Services</h2>
                    <p class="card-desc">Services attached exclusively to Customer #{{ e($customer['id']) }}</p>
                </div>
                <div class="card-body" style="padding: 0;">
                    @if(!empty($services) && count($services) > 0)
                        <table class="services-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Service Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th style="text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($services as $service)
                                    <tr>
                                        <td style="font-weight: 600;">#{{ e($service['id']) }}</td>
                                        <td>{{ e($service['name']) }}</td>
                                        <td>
                                            <code>{{ e($service['service_type']) }}</code>
                                        </td>
                                        <td>
                                            <span class="badge {{ $service['status'] === 'active' ? 'badge-active' : 'badge-suspended' }}">
                                                {{ e($service['status']) }}
                                            </span>
                                        </td>
                                        <td>{{ isset($service['created_at']) ? date('Y-m-d H:i', strtotime($service['created_at'])) : '—' }}</td>
                                        <td style="text-align: right;">
                                            @php
                                                $nextStatus = $service['status'] === 'active' ? 'suspended' : 'active';
                                            @endphp
                                            <form
                                                action="{{ route('services.updateStatus', ['serviceId' => $service['id']]) }}"
                                                method="POST"
                                                style="display: inline-block;"
                                                onsubmit="return confirm('Are you sure you want to change Service #{{ e($service['id']) }} status to {{ $nextStatus }}?');"
                                            >
                                                @csrf
                                                @method('PATCH')
                                                <input type="hidden" name="customer_id" value="{{ e($customer['id']) }}">
                                                <input type="hidden" name="status" value="{{ $nextStatus }}">
                                                <button
                                                    type="submit"
                                                    class="btn btn-sm {{ $nextStatus === 'suspended' ? 'btn-toggle-suspend' : 'btn-toggle-activate' }}"
                                                >
                                                    {{ $nextStatus === 'suspended' ? 'Suspend' : 'Activate' }}
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @else
                        <div class="empty-state">
                            No active or provisioned services found for Customer #{{ e($customer['id']) }}.
                        </div>
                    @endif
                </div>
            </div>
        @elseif(isset($customerId) && $customerId !== '' && !isset($error))
            <div class="card">
                <div class="card-body empty-state">
                    Please provide a valid Customer ID to retrieve records from the core cluster.
                </div>
            </div>
        @endif
    </main>

    <footer>
        Cloud Management Platform &copy; 2026 &bull; Strict Database Isolation &bull; Django REST Orchestration
    </footer>
</body>
</html>
