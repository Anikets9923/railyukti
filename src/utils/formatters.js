export function initials(name = '') { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() }
export function formatRole(role = '') { return role.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ') }
