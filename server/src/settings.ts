import { prisma } from "./prisma";

const defaultSettings: Record<string, string> = {
    username: "admin",
    password: "password"
};

export async function addSetting(name: string, defaultValue: string) {
    defaultSettings[name] = defaultValue;
}

export async function getSetting<T extends string | boolean | number = string>(name: string): Promise<T | null> {
    let setting = await prisma.setting.findUnique({ where: { name } });
    if (!setting) return null;
    const value = setting.value;
    if (value === "true") return true as T;
    if (value === "false") return false as T;
    const num = Number(value);
    if (!isNaN(num) && value != "") return num as T;
    return value as T;
}

export async function setSetting(name: string, value: string): Promise<void> {
    console.log(name, value)
    await prisma.setting.upsert({
        where: { name },
        update: { value },
        create: { name, value }
    });
}

export async function initSettings() {
    for (const setting of Object.keys(defaultSettings)) {
        if (!(await prisma.setting.findUnique({ where: { name: setting } }))) {
            await prisma.setting.create({
                data: {
                    name: setting,
                    value: defaultSettings[setting]!
                }
            });
            console.log("Created " + setting + " setting !");
        }
    }
}