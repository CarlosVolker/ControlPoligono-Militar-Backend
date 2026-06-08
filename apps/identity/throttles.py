from rest_framework.throttling import ScopedRateThrottle


class AuthEndpointThrottle(ScopedRateThrottle):
    scope = "auth"


class UnitSelectionThrottle(ScopedRateThrottle):
    scope = "unit_selection"
