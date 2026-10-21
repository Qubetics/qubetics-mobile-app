import { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-svg-charts';

export class AllocationGraph extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }
  /******************************************************************************************/
  render() {

    return (

      <View style={[{
        flex: 1,
      }]}>
        <View
          style={{
            alignSelf: "center",
            justifyContent: 'center',
            alignItems: 'center',
            shadowOpacity: 0.3, // Shadow opacity
            shadowRadius: 4, // Shadow radius
            flex: 1

          }}>

          <PieChart
            style={styles.pieChart}
            data={this.props?.pieData}
            outerRadius="95%"
            innerRadius="49%"
            padAngle={0.02}
            animate={true}
          />
        </View>
      </View>
    );
  }
}

/******************************************************************************************/
const styles = StyleSheet.create({
  pieChart: {
    height: 150,
    width: 150,
  },
});
