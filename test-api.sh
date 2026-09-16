#!/bin/bash
#
# Flyby Mission Planner - API smoke test script
#
# Usage:
#   ./test-api.sh            run all tests
#   ./test-api.sh all        run all tests
#   ./test-api.sh health     health check only
#   ./test-api.sh auth       login/authentication only
#   ./test-api.sh me         current-user endpoint only
#   ./test-api.sh missions   mission CRUD only
#   ./test-api.sh perms      permissions (pilot restricted) only
#
# Prerequisite: backend running on localhost:8080, database ready.

BASE="http://localhost:8080/api/v1"

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ADMIN_EMAIL="admin1@flyby.com"
ADMIN_PASS="admin1pass"
PILOT_EMAIL="pilot1@flyby.com"
PILOT_PASS="pilot1pass"

section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

login() {
    local email="$1"
    local pass="$2"
    curl -s -X POST "$BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$pass\"}" \
        | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//'
}

check_status() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    if [ "$actual" == "$expected" ]; then
        echo -e "  ${GREEN}[PASS]${NC} $desc (HTTP $actual)"
    else
        echo -e "  ${RED}[FAIL]${NC} $desc (expected $expected, got $actual)"
    fi
}

test_health() {
    section "Health check"
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
    check_status "GET /health should return 200" 200 "$code"
    echo "  Response: $(curl -s $BASE/health)"
}

test_auth() {
    section "Authentication"

    local code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
    check_status "Admin login with correct password should return 200" 200 "$code"

    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrongpass\"}")
    check_status "Wrong password should be rejected (403)" 403 "$code"

    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"nobody@flyby.com\",\"password\":\"whatever\"}")
    check_status "Non-existent email should be rejected (403)" 403 "$code"
}

test_me() {
    section "Current user endpoint /me"

    local token=$(login "$ADMIN_EMAIL" "$ADMIN_PASS")

    local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/me" \
        -H "Authorization: Bearer $token")
    check_status "Access /me with valid token should return 200" 200 "$code"
    echo "  Current user: $(curl -s $BASE/me -H "Authorization: Bearer $token")"

    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/me")
    check_status "Access /me without token should be rejected (403)" 403 "$code"
}

test_missions() {
    section "Mission CRUD (admin)"

    local token=$(login "$ADMIN_EMAIL" "$ADMIN_PASS")

    local create_resp=$(curl -s -X POST "$BASE/missions" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Survey Mission",
            "description": "A test mission",
            "assignedPilotId": 3,
            "defaultAltitudeM": 40,
            "speedMs": 5,
            "waypoints": [
                {"seq": 0, "lat": 37.7749, "lng": -122.4194, "altM": 40, "action": "TAKE_PHOTO"},
                {"seq": 1, "lat": 37.7760, "lng": -122.4180, "altM": 40, "action": null}
            ]
        }')
    echo "  Create response: $create_resp"
    local mission_id=$(echo "$create_resp" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    echo "  New mission id: $mission_id"

    local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/missions" \
        -H "Authorization: Bearer $token")
    check_status "GET /missions list should return 200" 200 "$code"
    echo "  List: $(curl -s $BASE/missions -H "Authorization: Bearer $token")"

    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/missions/$mission_id" \
        -H "Authorization: Bearer $token")
    check_status "GET /missions/$mission_id detail should return 200" 200 "$code"
    echo "  Detail: $(curl -s $BASE/missions/$mission_id -H "Authorization: Bearer $token")"

    code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/missions/$mission_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Updated Mission",
            "description": "Updated",
            "status": "READY",
            "assignedPilotId": 3,
            "defaultAltitudeM": 50,
            "speedMs": 6,
            "waypoints": [
                {"seq": 0, "lat": 37.7749, "lng": -122.4194, "altM": 50, "action": null}
            ]
        }')
    check_status "PUT /missions/$mission_id update should return 200" 200 "$code"

    code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/missions/$mission_id" \
        -H "Authorization: Bearer $token")
    check_status "DELETE /missions/$mission_id should return 200" 200 "$code"

    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/missions/$mission_id" \
        -H "Authorization: Bearer $token")
    echo "  Detail after delete: HTTP $code (should be an error code, not 200)"
}

test_perms() {
    section "Permissions (pilot restricted)"

    local pilot_token=$(login "$PILOT_EMAIL" "$PILOT_PASS")

    local code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/missions" \
        -H "Authorization: Bearer $pilot_token" \
        -H "Content-Type: application/json" \
        -d '{"name":"Pilot should not create","waypoints":[]}')
    check_status "Pilot creating a mission should be rejected (403)" 403 "$code"

    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/missions" \
        -H "Authorization: Bearer $pilot_token")
    check_status "Pilot listing missions should return 200 (own only)" 200 "$code"
    echo "  Pilot's list: $(curl -s $BASE/missions -H "Authorization: Bearer $pilot_token")"
}

TARGET="${1:-all}"

echo -e "${BLUE}Flyby API tests - target: $TARGET${NC}"

case "$TARGET" in
    health)   test_health ;;
    auth)     test_auth ;;
    me)       test_me ;;
    missions) test_missions ;;
    perms)    test_perms ;;
    all)
        test_health
        test_auth
        test_me
        test_missions
        test_perms
        ;;
    *)
        echo "Unknown target: $TARGET"
        echo "Options: all | health | auth | me | missions | perms"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=== Tests finished ===${NC}"