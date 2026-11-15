class UserRole {
    static ADMIN = "admin";
    static USER = "user";

    static values() {
        return [this.ADMIN, this.USER];
    }

    static isValid(value) {
        return this.values().includes(value);
    }
}

Object.freeze(UserRole);
export default UserRole;