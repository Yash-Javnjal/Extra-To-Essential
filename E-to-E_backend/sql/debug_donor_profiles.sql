-- Quick script to check if donor profile exists for current user
-- Run this to debug the listing creation issue

SELECT 
    p.id as profile_id,
    p.email,
    p.role,
    p.organization_name,
    d.donor_id,
    d.business_type,
    d.city
FROM profiles p
LEFT JOIN donors d ON d.profile_id = p.id
WHERE p.role = 'donor'
ORDER BY p.created_at DESC
LIMIT 5;
