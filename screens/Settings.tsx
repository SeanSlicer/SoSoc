import React, { useMemo } from "react";
import { Alert, Linking, ScrollView } from "react-native";
import { View, ActionSheet, Text } from "react-native-ui-lib";

import { Section } from "../components/section";
import { Action } from "../components/action";

type PickersStateKey = keyof Omit<PickersState, "show" | "hide">;
type PickersState = {
  appearance: boolean;
  language: boolean;

  show: <T extends PickersStateKey>(what: T) => void;
  hide: <T extends PickersStateKey>(what: T) => void;
};

export const Settings: React.FC = () => {
  return (
    <View flex bg-bgColor>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View padding-s4>
          <Section bg title="UI">
            <Action title="Appearance" rightIcon="chevron-forward" />

            <Action title="Language" rightIcon="chevron-forward" />
          </Section>

          <Section bg title="General">
            <View>
              <Action title="Share" icon="share-outline" />
              <Action title="Rate" icon="star-outline" />
              <Action title="Support" icon="mail-unread-outline" />
            </View>
          </Section>

          <Section bg title="Links">
            <View>
              <Action title="Github" icon="logo-github" />
              <Action title="Website" icon="earth-outline" />
            </View>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
};
