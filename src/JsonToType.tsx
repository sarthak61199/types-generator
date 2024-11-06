/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { sampleArrayJSON, sampleObjectJSON } from "@/examples";
import { Check, Copy, FileJson } from "lucide-react";
import React, { useState, useEffect } from "react";

const JsonToTypeScript = () => {
  const [input, setInput] = useState("{}");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [useInterface, setUseInterface] = useState(true);
  const [optionalProps, setOptionalProps] = useState(false);
  const [detectEnums, setDetectEnums] = useState(true);
  const [rootName, setRootName] = useState("Root");
  const [arrayItemName, setArrayItemName] = useState("Item");

  useEffect(() => {
    generateOutput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useInterface, optionalProps, detectEnums, rootName, arrayItemName]);

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      generateTypes(parsed);
    } catch (err) {
      setError("Invalid JSON input");
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detectPotentialEnum = (arr: any[]): string | null => {
    if (!detectEnums) return null;
    if (arr.length < 2) return null;
    if (arr.every((item) => typeof item === "string")) {
      return arr.map((item) => `'${item}'`).join(" | ");
    }
    return null;
  };

  const processValue = (value: any, key: string, isRoot = false): string => {
    if (value === null) return "null";
    if (typeof value !== "object") return typeof value;

    if (Array.isArray(value)) {
      if (value.length === 0) return "any[]";

      // Check for enum
      const enumType = detectPotentialEnum(value);
      if (enumType) {
        if (!isRoot) {
          return enumType;
        }
        return `type ${key}Type = ${enumType};\n${key}: ${key}Type[];`;
      }

      // Check for mixed types in array
      const types = new Set(value.map((item) => processValue(item, key)));
      if (types.size > 1) {
        return `(${Array.from(types).join(" | ")})[]`;
      }

      return `${processValue(value[0], key)}[]`;
    }

    const properties = Object.entries(value).map(([k, v]) => {
      const type = processValue(v, k);
      const optional = optionalProps && v === null ? "?" : "";
      return `  ${k}${optional}: ${type};`;
    });

    return `{\n${properties.join("\n")}\n}`;
  };

  const generateTypes = (data: any): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return `type ${rootName} = any[];`;
      }

      // Generate type for array items
      const itemType = processValue(data[0], arrayItemName);
      const keyword = useInterface ? "interface" : "type";
      const arrayItemDef = `${keyword} ${arrayItemName} ${
        useInterface ? "" : "="
      } ${itemType}`;

      // Generate array type
      const arrayType = `type ${rootName} = ${arrayItemName}[];`;

      return `${arrayItemDef}\n\n${arrayType}`;
    }

    // Handle object case
    const properties = Object.entries(data).map(([key, value]) => {
      const type = processValue(value, key, true);
      const optional = optionalProps && value === null ? "?" : "";
      return `  ${key}${optional}: ${type};`;
    });

    const keyword = useInterface ? "interface" : "type";
    const equals = useInterface ? "" : " =";
    return `${keyword} ${rootName}${equals} {\n${properties.join("\n")}\n}`;
  };

  const generateOutput = () => {
    const parsed = JSON.parse(input);
    const types = generateTypes(parsed);
    setOutput(types);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setError("");
    try {
      const parsed = JSON.parse(e.target.value || "{}");
      const types = generateTypes(parsed);
      setOutput(types);
    } catch (err) {
      setError("Invalid JSON input");
      setOutput("");
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>JSON to TypeScript Type Generator</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setInput(JSON.stringify(sampleObjectJSON, null, 2))
              }
            >
              Object Example
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput(JSON.stringify(sampleArrayJSON, null, 2))}
            >
              Array Example
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Switch
                checked={useInterface}
                onCheckedChange={setUseInterface}
                id="interface-toggle"
              />
              <label htmlFor="interface-toggle" className="text-sm">
                Use Interface
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={optionalProps}
                onCheckedChange={setOptionalProps}
                id="optional-toggle"
              />
              <label htmlFor="optional-toggle" className="text-sm">
                Optional Properties
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={detectEnums}
                onCheckedChange={setDetectEnums}
                id="enum-toggle"
              />
              <label htmlFor="enum-toggle" className="text-sm">
                Detect Enums
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Root Type Name:</label>
              <Input
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="Root type name"
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Array Item Name:</label>
              <Input
                value={arrayItemName}
                onChange={(e) => setArrayItemName(e.target.value)}
                placeholder="Array item type name"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">JSON Input:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={formatJSON}
                className="flex items-center gap-1"
              >
                <FileJson className="w-4 h-4" />
                Format JSON
              </Button>
            </div>
            <textarea
              className="w-full h-96 p-2 font-mono text-sm border rounded-md"
              value={input}
              onChange={handleInputChange}
              placeholder="Paste your JSON here..."
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">
                TypeScript Output:
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-1"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="w-full h-96 p-2 font-mono text-sm bg-gray-50 border rounded-md overflow-auto">
              {output}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JsonToTypeScript;
