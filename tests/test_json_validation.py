import json
from jsonschema import Draft7Validator


def load(path):
    with open(path, 'r') as f:
        return json.load(f)


ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "name", "type", "effect", "drop_rate", "value"],
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "type": {"type": "string"},
                    "effect": {"type": "string"},
                    "drop_rate": {"type": "number"},
                    "value": {"type": "number"}
                },
                "additionalProperties": True
            }
        }
    },
    "required": ["items"],
    "additionalProperties": False
}


SKILL_SCHEMA = {
    "type": "object",
    "properties": {
        "skills": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "name", "power", "attribute", "effect", "range"],
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "power": {"type": "number"},
                    "attribute": {"type": "string"},
                    "effect": {"type": "string"},
                    "range": {"type": "number"}
                },
                "additionalProperties": True
            }
        }
    },
    "required": ["skills"],
    "additionalProperties": False
}


UNIT_SCHEMA = {
    "type": "object",
    "properties": {
        "units": {
            "type": "array",
            "items": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "level",
                    "maxLevel",
                    "reincarnationLevel",
                    "growPoint",
                    "image",
                    "hp",
                    "maxHp",
                    "mp",
                    "maxMp",
                    "attack",
                    "maxAttack",
                    "defense",
                    "maxDefense",
                    "speed",
                    "maxSpeed",
                    "race",
                    "element",
                    "rank",
                    "weaponSlots",
                    "artifactSlots",
                    "weaponTypes",
                    "acquired",
                    "skills",
                    "bossSkills",
                    "drops",
                    "reward",
                    "description"
                ],
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "level": {"type": "number"},
                    "maxLevel": {"type": "number"},
                    "reincarnationLevel": {"type": "number"},
                    "growPoint": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": {"type": "number"}
                        }
                    },
                    "image": {"type": "string"},
                    "hp": {"type": "number"},
                    "maxHp": {"type": "number"},
                    "mp": {"type": "number"},
                    "maxMp": {"type": "number"},
                    "attack": {"type": "number"},
                    "maxAttack": {"type": "number"},
                    "defense": {"type": "number"},
                    "maxDefense": {"type": "number"},
                    "speed": {"type": "number"},
                    "maxSpeed": {"type": "number"},
                    "race": {"type": "string"},
                    "element": {"type": "string"},
                    "rank": {"type": "number"},
                    "weaponSlots": {"type": "number"},
                    "artifactSlots": {"type": "number"},
                    "weaponTypes": {"type": "array", "items": {"type": "string"}},
                    "acquired": {"type": "boolean"},
                    "skills": {"type": "array", "items": {"type": "string"}},
                    "bossSkills": {"type": "array", "items": {"type": "string"}},
                    "drops": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["item", "rate"],
                            "properties": {
                                "item": {"type": "string"},
                                "rate": {"type": "number"}
                            },
                            "additionalProperties": False
                        }
                    },
                    "reward": {
                        "type": "object",
                        "properties": {
                            "gold": {"type": "number"},
                            "exp": {"type": "number"}
                        },
                        "required": ["gold", "exp"],
                        "additionalProperties": False
                    },
                    "description": {"type": "string"}
                },
                "additionalProperties": False
            }
        }
    },
    "required": ["units"],
    "additionalProperties": False
}


def test_items_schema():
    Draft7Validator(ITEM_SCHEMA).validate(load("data/items.json"))


def test_skills_schema():
    Draft7Validator(SKILL_SCHEMA).validate(load("data/skills.json"))


def test_units_schema():
    Draft7Validator(UNIT_SCHEMA).validate(load("data/units.json"))


def test_boss_skills_schema():
    Draft7Validator(SKILL_SCHEMA).validate(load("data/boss_skills.json"))

