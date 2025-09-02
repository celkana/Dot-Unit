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
                    "hp",
                    "mp",
                    "attack",
                    "defense",
                    "speed",
                    "race",
                    "element",
                    "skills"
                ],
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "hp": {"type": "number"},
                    "mp": {"type": "number"},
                    "attack": {"type": "number"},
                    "defense": {"type": "number"},
                    "speed": {"type": "number"},
                    "race": {"type": "string"},
                    "element": {"type": "string"},
                    "skills": {"type": "array"},
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
                    }
                },
                "additionalProperties": True
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
