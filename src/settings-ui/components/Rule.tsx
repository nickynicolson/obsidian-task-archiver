import { Accessor, For } from "solid-js";

import { DateFormatDescription } from "./DateFormatDescription";
import { PlaceholderAccordion } from "./PlaceholderAccordion";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { ButtonSetting } from "./setting/ButtonSetting";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";

import { placeholders } from "../../Constants";
import { Rule as RuleType } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface RuleProps {
  placeholderResolver: PlaceholderService;
  index: Accessor<number>;
}

function dedupe(value: string) {
  return [...new Set(value.split(""))].join("");
}

export function Rule(props: RuleProps) {
  const [settings, setSettings] = useSettingsContext();
  const ruleSettings = () => settings.rules[props.index()];
  const dateFormat = () => ruleSettings().dateFormat;
  const archivePath = () => ruleSettings().defaultArchiveFileName;
  const dedupedStatuses = () => dedupe(ruleSettings().statuses);
  const pathPatterns = () => ruleSettings().pathPatterns;

  const updateRule = (newValues: Partial<RuleType>) =>
    setSettings("rules", (rule, i) => i === props.index(), newValues);
  const deleteRule = () =>
    setSettings("rules", (prev) => prev.filter((rule, i) => i !== props.index()));

  const renderStatusExamples = () => (
    <>
      These tasks will be matched:
      <ul class="archiver-status-examples">
        <For each={dedupedStatuses().split("")}>
          {(status) => (
            <li>
              <code>- [{status}] task</code>
            </li>
          )}
        </For>
      </ul>
    </>
  );

  const statusesDescription = () =>
    dedupedStatuses().length === 0
      ? "Add some statuses, like '>', '-', '?'. Right now all the statuses will match"
      : renderStatusExamples();

  return (
    <div class="archiver-rule-container">
      <h2>When</h2>

      <TextSetting
        onInput={(event) => {
          const dedupedValue = dedupe(event.currentTarget.value);

          if (dedupedValue === dedupedStatuses()) {
            // eslint-disable-next-line no-param-reassign
            event.currentTarget.value = dedupedValue;
          } else {
            updateRule({ statuses: dedupedValue });
          }
        }}
        name="a task has one of statuses"
        description={statusesDescription()}
        placeholder={"-?>"}
        value={dedupedStatuses()}
      />

      <TextAreaSetting
        onInput={({ currentTarget: { value } }) => {
          updateRule({ pathPatterns: value });
        }}
        name="and the file matches one of patterns"
        value={pathPatterns() || ""}
        description="Add a pattern per line. No patterns means all files will match"
        placeholder="path/to/project\n.*tasks"
        inputClass="archiver-rule-paths"
      />

      <h2>Then</h2>

      <BaseSetting name="Move it to another file" />
      <TextAreaSetting
        onInput={({ currentTarget: { value } }) =>
          updateRule({ defaultArchiveFileName: value })
        }
        name="Destination file path"
        description={
          <PlaceholdersDescription placeholderResolver={props.placeholderResolver} />
        }
        value={archivePath()}
        placeholder={`path/to/${placeholders.ACTIVE_FILE_NEW} archive`}
        class="archiver-setting-sub-item"
      />
      <PlaceholderAccordion>
        <TextSetting
          onInput={({ currentTarget: { value } }) => updateRule({ dateFormat: value })}
          name="Date format"
          description={<DateFormatDescription dateFormat={dateFormat()} />}
          value={dateFormat()}
          class="archiver-setting-sub-item"
        />
      </PlaceholderAccordion>
      <ButtonSetting onClick={deleteRule} buttonText="Delete rule" />
    </div>
  );
}
